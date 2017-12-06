const path = require('path');
const {promisify} = require('util');
const url = require('url');
const {readJson, writeJson} = require('fs-extra');
const {cloneDeep, defaults, mapKeys, camelCase, assign} = require('lodash');
const log = require('npmlog');
const nopt = require('nopt');
const npmconf = require('npmconf');
const normalizeData = require('normalize-package-data');

module.exports = async () => {
  log.heading = 'semantic-release';
  const env = process.env;
  const pkg = await readJson('./package.json');
  const originalPkg = cloneDeep(pkg);
  normalizeData(pkg);
  const knownOptions = {
    branch: String,
    debug: Boolean,
    'github-token': String,
    'github-url': String,
    'analyze-commits': [path, String],
    'generate-notes': [path, String],
    'verify-conditions': [path, String],
    'verify-release': [path, String],
  };
  const options = defaults(
    mapKeys(nopt(knownOptions), (value, key) => {
      return camelCase(key);
    }),
    pkg.release,
    {
      branch: 'master',
      fallbackTags: {next: 'latest'},
      debug: !env.CI,
      githubToken: env.GH_TOKEN || env.GITHUB_TOKEN,
      githubUrl: env.GH_URL,
    }
  );
  const plugins = require('../src/lib/plugins')(options);
  let conf;
  try {
    conf = await promisify(npmconf.load)({});
  } catch (err) {
    log.error('init', 'Failed to load npm config.', err);
    process.exit(1);
  }

  const npm = {
    auth: {token: env.NPM_TOKEN},
    cafile: conf.get('cafile'),
    loglevel: conf.get('loglevel'),
    registry: require('../src/lib/get-registry')(pkg, conf),
    tag: (pkg.publishConfig || {}).tag || conf.get('tag') || 'latest',
  };

  // normalize trailing slash
  npm.registry = url.format(url.parse(npm.registry));
  log.level = npm.loglevel;

  const config = {env: env, pkg: pkg, options: options, plugins: plugins, npm: npm};
  const hide = {};
  if (options.githubToken) hide.githubToken = '***';

  log.verbose('init', 'options:', assign({}, options, hide));
  log.verbose('init', 'Verifying config.');

  const errors = require('../src/lib/verify')(config);
  errors.forEach(err => {
    log.error('init', err.message + ' ' + err.code);
  });
  if (errors.length) process.exit(1);

  if (options.argv.remain[0] === 'pre') {
    log.verbose('pre', 'Running pre-script.');
    log.verbose('pre', 'Veriying conditions.');
    try {
      await plugins.verifyConditions(config);
    } catch (err) {
      log[options.debug ? 'warn' : 'error']('pre', err.message);
      if (!options.debug) process.exit(1);
    }

    const nerfDart = require('nerf-dart')(npm.registry);
    let wroteNpmRc = false;

    if (env.NPM_OLD_TOKEN && env.NPM_EMAIL) {
      // Using the old auth token format is not considered part of the public API
      // This might go away anytime (i.e. once we have a better testing strategy)
      conf.set('_auth', '${NPM_OLD_TOKEN}', 'project'); // eslint-disable-line no-template-curly-in-string
      conf.set('email', '${NPM_EMAIL}', 'project'); // eslint-disable-line no-template-curly-in-string
      wroteNpmRc = true;
    } else if (env.NPM_TOKEN) {
      conf.set(nerfDart + ':_authToken', '${NPM_TOKEN}', 'project'); // eslint-disable-line no-template-curly-in-string
      wroteNpmRc = true;
    }

    try {
      await promisify(conf.save.bind(conf))('project');
    } catch (err) {
      return log.error('pre', 'Failed to save npm config.', err);
    }

    if (wroteNpmRc) log.verbose('pre', 'Wrote authToken to .npmrc.');

    let release;
    try {
      release = await require('../src/pre')(config);
    } catch (err) {
      log.error('pre', 'Failed to determine new version.');

      const args = ['pre', (err.code ? err.code + ' ' : '') + err.message];
      if (err.stack) args.push(err.stack);
      log.error.apply(log, args);
      process.exit(1);
    }

    const message = 'Determined version ' + release.version + ' as "' + npm.tag + '".';

    log.verbose('pre', message);

    if (options.debug) {
      log.error('pre', message + ' Not publishing in debug mode.', release);
      process.exit(1);
    }

    try {
      const shrinkwrap = await readJson('./npm-shrinkwrap.json');
      shrinkwrap.version = release.version;
      await writeJson('./npm-shrinkwrap.json', shrinkwrap);
      log.verbose('pre', 'Wrote version ' + release.version + 'to npm-shrinkwrap.json.');
    } catch (e) {
      log.silly('pre', "Couldn't find npm-shrinkwrap.json.");
    }

    await writeJson('./package.json', assign(originalPkg, {version: release.version}));

    log.verbose('pre', 'Wrote version ' + release.version + ' to package.json.');
  } else if (options.argv.remain[0] === 'post') {
    log.verbose('post', 'Running post-script.');

    let published, release;
    try {
      ({published, release} = await require('../src/post')(config));
      log.verbose('post', (published ? 'Published' : 'Generated') + ' release notes.', release);
    } catch (err) {
      log.error('post', 'Failed to publish release notes.', err);
      process.exit(1);
    }
  } else {
    log.error('post', 'Command "' + options.argv.remain[0] + '" not recognized. Use either "pre" or "post"');
  }
};

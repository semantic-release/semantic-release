const {castArray, pickBy, isNil, isString, isPlainObject} = require('lodash');
const readPkgUp = require('read-pkg-up');
const {cosmiconfig} = require('cosmiconfig');
const resolveFrom = require('resolve-from');
const debug = require('debug')('semantic-release:config');
const {repoUrl} = require('./git');
const PLUGINS_DEFINITIONS = require('./definitions/plugins');
const plugins = require('./plugins');
const {validatePlugin, parseConfig} = require('./plugins/utils');
const getError = require('./get-error');

const CONFIG_NAME = 'release';

async function pkgRepoUrl(options) {
  const {packageJson} = (await readPkgUp(options)) || {};
  return packageJson && (isPlainObject(packageJson.repository) ? packageJson.repository.url : packageJson.repository);
}

async function ciInferFromEnv(env) {
  // currently, used in GitLab
  if ( env["CI_REPOSITORY_URL"] ) {
    let url = new URL(env["CI_REPOSITORY_URL"]);

    // By default the password is set to the GITLAB_CI_TOKEN This will allow the
    // publication of releases, it will not allow pushing tags to Git which is
    // how the releases are currently tracked by default.  In order to just use
    // the GITLAB_CI_TOKEN, versions will have to be infered from GitLab
    // releases. Moreover, even then you couldn't push changelogs and bump
    // versions in manifests
    // Solution: If we have a GitLab token use that instead.
    if ( env["GITLAB_TOKEN"] !== undefined ) {
      url.username = 'oauth2';
      url.password = env["GITLAB_TOKEN"];
    }

    return url.toString();
  }
  return null;
}

async function repoUrlResolve(options) {
  let {cwd, env, ci} = options;
  let ret;

  if (ci) {
    ret ||= await ciInferFromEnv(env);
  }

  // get from package.json
  ret ||= await pkgRepoUrl({normalize: false, cwd});

  // get from git
  ret ||= await repoUrl({cwd, env});

  debug("Resolved repoUrl to %s", ret);

  return ret;
}

const DEFAULTS = {
  branches: [
    '+([0-9])?(.{+([0-9]),x}).x',
    'master',
    'next',
    'next-major',
    {name: 'beta', prerelease: true},
    {name: 'alpha', prerelease: true},
  ],
  tagFormat: `v\${version}`,
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@semantic-release/github',
  ],
};

module.exports = async (context, cliOptions) => {
  const {cwd, env} = context;
  const {config, filepath} = (await cosmiconfig(CONFIG_NAME).search(cwd)) || {};
  
  if ( filepath === undefined ) {
    debug( getError('ECONFIGNOTFOUND') );
  }
  // Will trigger if the file is .js but doesn't set modules.exports
  else if ( Object.prototype.constructor.keys(config||{}).length == 0 ) {
    throw getError('EEMPTYCONFIG', {filepath});
  }

  // Merge config file options and CLI/API options
  let options = {...config, ...cliOptions};

  const pluginsPath = {};
  let extendPaths;
  ({extends: extendPaths, ...options} = options);
  if (extendPaths) {
    // If `extends` is defined, load and merge each shareable config with `options`
    options = {
      ...castArray(extendPaths).reduce((result, extendPath) => {
        const extendsOptions = require(resolveFrom.silent(__dirname, extendPath) || resolveFrom(cwd, extendPath));

        // For each plugin defined in a shareable config, save in `pluginsPath` the extendable config path,
        // so those plugin will be loaded relatively to the config file
        Object.entries(extendsOptions)
          .filter(([, value]) => Boolean(value))
          .reduce((pluginsPath, [option, value]) => {
            castArray(value).forEach((plugin) => {
              if (option === 'plugins' && validatePlugin(plugin)) {
                pluginsPath[parseConfig(plugin)[0]] = extendPath;
              } else if (
                PLUGINS_DEFINITIONS[option] &&
                (isString(plugin) || (isPlainObject(plugin) && isString(plugin.path)))
              ) {
                pluginsPath[isString(plugin) ? plugin : plugin.path] = extendPath;
              }
            });
            return pluginsPath;
          }, pluginsPath);

        return {...result, ...extendsOptions};
      }, {}),
      ...options,
    };
  }

  // Set default options values if not defined yet
  options = {
    ...DEFAULTS,
    // Remove `null` and `undefined` options so they can be replaced with default ones
    ...pickBy(options, (option) => !isNil(option)),
    ...(options.branches ? {branches: castArray(options.branches)} : {}),
  };
  
  // Not sure why we have noCi, for more information see GH #1696
  if (options.ci === true || options.ci === false) {
    options.noCi = !options.ci;
  }
  else if (options.noCi === true || options.noCi === false) {
    options.ci = !options.noCi;
  }
  else if (env["CI"] !== undefined) {
    let ci = env["CI"] ? true : false;
    options.ci = ci;
    options.noCi = !ci;
  }

  options["repositoryUrl"] = await repoUrlResolve({cwd, env, ci: options.ci});

  debug(`Load config %O`,{filepath, 'unprocessed_config': config, 'processed_options': options});

  return {options, plugins: await plugins({...context, options}, pluginsPath)};
};


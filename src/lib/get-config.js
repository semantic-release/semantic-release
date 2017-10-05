const url = require('url');
const {readJson} = require('fs-extra');
const {defaults} = require('lodash');
const npmConf = require('npm-conf');
const normalizeData = require('normalize-package-data');
const debug = require('debug')('semantic-release:config');
const logger = require('./logger');
const getPlugins = require('./plugins');
const getRegistry = require('./get-registry');

module.exports = async opts => {
  const pkg = await readJson('./package.json');
  const {GH_TOKEN, GITHUB_TOKEN, GH_URL} = process.env;
  normalizeData(pkg);
  const options = defaults(opts, pkg.release, {
    branch: 'master',
    fallbackTags: {next: 'latest'},
    githubToken: GH_TOKEN || GITHUB_TOKEN,
    githubUrl: GH_URL,
  });
  debug('branch: %O', options.branch);
  debug('fallbackTags: %O', options.fallbackTags);
  debug('analyzeCommits: %O', options.analyzeCommits);
  debug('generateNotes: %O', options.generateNotes);
  debug('verifyConditions: %O', options.verifyConditions);
  debug('verifyRelease: %O', options.verifyRelease);

  const plugins = await getPlugins(options);
  const conf = npmConf();
  const npm = {
    auth: {token: process.env.NPM_TOKEN},
    registry: getRegistry(pkg, conf),
    tag: (pkg.publishConfig || {}).tag || conf.get('tag'),
    conf,
  };

  // normalize trailing slash
  npm.registry = url.format(url.parse(npm.registry));

  debug('npm registry: %O', npm.registry);
  debug('npm tag: %O', npm.tag);
  return {env: process.env, pkg, options, plugins, npm, logger};
};

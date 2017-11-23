const readPkgUp = require('read-pkg-up');
const {defaults} = require('lodash');
const cosmiconfig = require('cosmiconfig');
const debug = require('debug')('semantic-release:config');
const {repoUrl} = require('./git');
const plugins = require('./plugins');

module.exports = async (opts, logger) => {
  const {config} = (await cosmiconfig('release', {rcExtensions: true}).load(process.cwd())) || {};
  const options = defaults(opts, config, {branch: 'master', repositoryUrl: (await pkgRepoUrl()) || (await repoUrl())});

  debug('name: %O', options.name);
  debug('branch: %O', options.branch);
  debug('repositoryUrl: %O', options.repositoryUrl);
  debug('analyzeCommits: %O', options.analyzeCommits);
  debug('generateNotes: %O', options.generateNotes);
  debug('verifyConditions: %O', options.verifyConditions);
  debug('verifyRelease: %O', options.verifyRelease);
  debug('publish: %O', options.publish);

  return {options, plugins: await plugins(options, logger)};
};

async function pkgRepoUrl() {
  const {pkg} = await readPkgUp();
  return pkg && pkg.repository ? pkg.repository.url : null;
}

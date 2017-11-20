const {readJson} = require('fs-extra');
const {defaults} = require('lodash');
const normalizeData = require('normalize-package-data');
const debug = require('debug')('semantic-release:config');
const plugins = require('./plugins');

module.exports = async (opts, logger) => {
  const pkg = await readJson('./package.json');
  normalizeData(pkg);
  const options = defaults(opts, pkg.release, {branch: 'master'});
  debug('branch: %O', options.branch);
  debug('analyzeCommits: %O', options.analyzeCommits);
  debug('generateNotes: %O', options.generateNotes);
  debug('verifyConditions: %O', options.verifyConditions);
  debug('verifyRelease: %O', options.verifyRelease);
  debug('publish: %O', options.publish);

  return {env: process.env, pkg, options, plugins: await plugins(options, logger), logger};
};

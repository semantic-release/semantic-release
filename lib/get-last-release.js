const semver = require('semver');
const pLocate = require('p-locate');
const debug = require('debug')('semantic-release:get-last-release');
const {gitTags, isRefInHistory, gitTagHead} = require('./git');

/**
 * Last release.
 *
 * @typedef {Object} LastRelease
 * @property {string} version The version number of the last release.
 * @property {string} [gitHead] The Git reference used to make the last release.
 */

/**
 * Determine the Git tag and version of the last tagged release.
 *
 * - Obtain all the tags referencing commits in the current branch history
 * - Filter out the ones that are not valid semantic version
 * - Sort the tags
 * - Retrive the highest tag
 *
 * @param {Object} logger Global logger.
 * @return {Promise<LastRelease>} The last tagged release or `undefined` if none is found.
 */
module.exports = async logger => {
  const tags = (await gitTags()).filter(tag => semver.valid(semver.clean(tag))).sort(semver.rcompare);
  debug('found tags: %o', tags);

  if (tags.length > 0) {
    const gitTag = await pLocate(tags, tag => isRefInHistory(tag), {concurrency: 1, preserveOrder: true});
    logger.log('Found git tag version %s', gitTag);
    return {gitTag, gitHead: await gitTagHead(gitTag), version: semver.valid(semver.clean(gitTag))};
  }

  logger.log('No git tag version found');
  return {};
};

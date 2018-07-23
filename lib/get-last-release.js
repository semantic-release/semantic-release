const {escapeRegExp, template} = require('lodash');
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
 * - Filter out the ones that are not valid semantic version or doesn't match the `tagFormat`
 * - Sort the versions
 * - Retrive the highest version
 *
 * @param {Object} context semantic-release context.
 *
 * @return {Promise<LastRelease>} The last tagged release or `undefined` if none is found.
 */
module.exports = async ({cwd, env, options: {tagFormat}, logger}) => {
  // Generate a regex to parse tags formatted with `tagFormat`
  // by replacing the `version` variable in the template by `(.+)`.
  // The `tagFormat` is compiled with space as the `version` as it's an invalid tag character,
  // so it's guaranteed to no be present in the `tagFormat`.
  const tagRegexp = `^${escapeRegExp(template(tagFormat)({version: ' '})).replace(' ', '(.+)')}`;
  const tags = (await gitTags({cwd, env}))
    .map(tag => ({gitTag: tag, version: (tag.match(tagRegexp) || new Array(2))[1]}))
    .filter(
      tag => tag.version && semver.valid(semver.clean(tag.version)) && !semver.prerelease(semver.clean(tag.version))
    )
    .sort((a, b) => semver.rcompare(a.version, b.version));

  debug('found tags: %o', tags);

  const tag = await pLocate(tags, tag => isRefInHistory(tag.gitTag, {cwd, env}), {preserveOrder: true});

  if (tag) {
    logger.log(`Found git tag ${tag.gitTag} associated with version ${tag.version}`);
    return {gitHead: await gitTagHead(tag.gitTag, {cwd, env}), ...tag};
  }

  logger.log('No git tag version found');
  return {};
};

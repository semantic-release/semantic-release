const debug = require('debug')('semantic-release:get-version-head');
const SemanticReleaseError = require('@semantic-release/error');
const {gitTagHead, gitCommitTag, isCommitInHistory, unshallow} = require('./git');

/**
 * Get the commit sha for a given version, if it's contained in the given branch.
 *
 * @param {string} gitHead The commit sha to look for.
 * @param {string} version The version corresponding to the commit sha to look for. Used to search in git tags.
 *
 * @return {Promise<Object>} A Promise that resolves to an object with the `gitHead` and `gitTag` for the the `version`.
 *
 * @throws {SemanticReleaseError} with code `ENOTINHISTORY` if `gitHead` or the commit sha dereived from `version` is not in the direct history of `branch`.
 * @throws {SemanticReleaseError} with code `ENOGITHEAD` if `gitHead` is undefined and no commit sha can be found for the `version`.
 */
module.exports = async (gitHead, version) => {
  // Check if gitHead is defined and exists in release branch
  if (gitHead && (await isCommitInHistory(gitHead))) {
    debug('Use gitHead: %s', gitHead);
    return {gitHead, gitTag: await gitCommitTag(gitHead)};
  }

  await unshallow();

  // Check if gitHead is defined and exists in release branch again
  if (gitHead && (await isCommitInHistory(gitHead))) {
    debug('Use gitHead: %s', gitHead);
    return {gitHead, gitTag: await gitCommitTag(gitHead)};
  }

  let tagHead;
  if (version) {
    // If a version is defined search a corresponding tag
    tagHead = (await gitTagHead(`v${version}`)) || (await gitTagHead(version));

    // Check if tagHead is found and exists in release branch again
    if (tagHead && (await isCommitInHistory(tagHead))) {
      debug('Use tagHead: %s', tagHead);
      return {gitHead: tagHead, gitTag: await gitCommitTag(tagHead)};
    }
  }

  // Either gitHead is defined or a tagHead has been found but none is in the branch history
  if (gitHead || tagHead) {
    const error = new SemanticReleaseError('Commit not in history', 'ENOTINHISTORY');
    error.gitHead = gitHead || tagHead;
    throw error;
  }

  // There is no gitHead in the last release and there is no tags correponsing to the last release version
  throw new SemanticReleaseError('There is no commit associated with last release', 'ENOGITHEAD');
};

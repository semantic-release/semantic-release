const SemanticReleaseError = require('@semantic-release/error');
const execa = require('execa');

/**
 * Get the commit sha for a given tag.
 *
 * @param {string} tagName Tag name for which to retrieve the commit sha.
 * 
 * @return {string} The commit sha of the tag in parameter or `null`.
 */
async function gitTagHead(tagName) {
  try {
    return (await execa('git', ['rev-list', '-1', '--tags', tagName])).stdout;
  } catch (err) {
    return null;
  }
}

/**
 * Verify if the commist `sha` is in the direct history of the current branch.
 * 
 * @param {string} sha The sha of the commit to look for.
 * 
 * @return {boolean} `true` if the commit `sha` is in the history of the current branch, `false` otherwise.
 */
async function isCommitInHistory(sha) {
  return (await execa('git', ['merge-base', '--is-ancestor', sha, 'HEAD'], {reject: false})).code === 0;
}

/**
 * Get the commit sha for a given version, if it's contained in the given branch.
 *
 * @param {string} gitHead The commit sha to look for.
 * @param {string} version The version corresponding to the commit sha to look for. Used to search in git tags.
 * 
 * @return {Promise<string>} A Promise that resolves to the commit sha of the version, either `gitHead` of the commit associated with the `version` tag.
 * 
 * @throws {SemanticReleaseError} with code `ENOTINHISTORY` if `gitHead` or the commit sha dereived from `version` is not in the direct history of `branch`.
 * @throws {SemanticReleaseError} with code `ENOGITHEAD` if `gitHead` is undefined and no commit sha can be found for the `version`.
 */
module.exports = async (gitHead, version) => {
  // Check if gitHead is defined and exists in release branch
  if (gitHead && (await isCommitInHistory(gitHead))) {
    return gitHead;
  }

  // Ushallow the repository
  await execa('git', ['fetch', '--unshallow', '--tags'], {reject: false});

  // Check if gitHead is defined and exists in release branch again
  if (gitHead && (await isCommitInHistory(gitHead))) {
    return gitHead;
  }

  let tagHead;
  if (version) {
    // If a version is defined search a corresponding tag
    tagHead = (await gitTagHead(`v${version}`)) || (await gitTagHead(version));

    // Check if tagHead is found and exists in release branch again
    if (tagHead && (await isCommitInHistory(tagHead))) {
      return tagHead;
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

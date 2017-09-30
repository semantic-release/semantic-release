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
 * Get the list of branches that contains the given commit.
 *
 * @param {string} sha The sha of the commit to look for.
 * 
 * @return {Array<string>} The list of branches that contains the commit sha in parameter.
 */
async function getCommitBranches(sha) {
  try {
    return (await execa('git', ['branch', '--no-color', '--contains', sha])).stdout
      .split('\n')
      .map(branch => branch.replace('*', '').trim())
      .filter(branch => !!branch);
  } catch (err) {
    return [];
  }
}

/**
 * Get the commit sha for a given version, if it is contained in the given branch.
 *
 * @param {string} version The version corresponding to the commit sha to look for. Used to search in git tags.
 * @param {string} branch The branch that must have the commit in its direct history.
 * @param {string} gitHead The commit sha to verify.
 * 
 * @return {Promise<string>} A Promise that resolves to `gitHead` if defined and if present in branch direct history or the commit sha corresponding to `version`.
 * 
 * @throws {SemanticReleaseError} with code `ENOTINHISTORY` if `gitHead` or the commit sha dereived from `version` is not in the direct history of `branch`. The Error will have a `branches` attributes with the list of branches containing the commit. 
 * @throws {SemanticReleaseError} with code `ENOGITHEAD` if `gitHead` is undefined and no commit sha can be found for the `version`.
 */
module.exports = async (version, branch, gitHead) => {
  if (!gitHead && version) {
    // Look for the version tag only if no gitHead exists
    gitHead = (await gitTagHead(`v${version}`)) || (await gitTagHead(version));
  }

  if (gitHead) {
    // Retrieve the branches containing the gitHead and verify one of them is the branch in param
    const branches = await getCommitBranches(gitHead);
    if (!branches.includes(branch)) {
      const error = new SemanticReleaseError('Commit not in history', 'ENOTINHISTORY');
      error.branches = branches;
      throw error;
    }
  } else {
    throw new SemanticReleaseError('There is no commit associated with last release', 'ENOGITHEAD');
  }
  return gitHead;
};

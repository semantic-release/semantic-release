const execa = require('execa');
const debug = require('debug')('semantic-release:git');

/**
 * Get the commit sha for a given tag.
 *
 * @param {string} tagName Tag name for which to retrieve the commit sha.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {string} The commit sha of the tag in parameter or `null`.
 */
async function gitTagHead(tagName, execaOpts) {
  try {
    return await execa.stdout('git', ['rev-list', '-1', tagName], execaOpts);
  } catch (error) {
    debug(error);
  }
}

/**
 * Get all the repository tags.
 *
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {Array<String>} List of git tags.
 * @throws {Error} If the `git` command fails.
 */
async function gitTags(execaOpts) {
  return (await execa.stdout('git', ['tag'], execaOpts))
    .split('\n')
    .map(tag => tag.trim())
    .filter(tag => Boolean(tag));
}

/**
 * Verify if the `ref` is in the direct history of the current branch.
 *
 * @param {string} ref The reference to look for.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {boolean} `true` if the reference is in the history of the current branch, falsy otherwise.
 */
async function isRefInHistory(ref, execaOpts) {
  try {
    await execa('git', ['merge-base', '--is-ancestor', ref, 'HEAD'], execaOpts);
    return true;
  } catch (error) {
    if (error.code === 1) {
      return false;
    }

    debug(error);
    throw error;
  }
}

/**
 * Unshallow the git repository if necessary and fetch all the tags.
 *
 * @param {String} repositoryUrl The remote repository URL.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 */
async function fetch(repositoryUrl, execaOpts) {
  try {
    await execa('git', ['fetch', '--unshallow', '--tags', repositoryUrl], execaOpts);
  } catch (error) {
    await execa('git', ['fetch', '--tags', repositoryUrl], execaOpts);
  }
}

/**
 * Get the HEAD sha.
 *
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {string} the sha of the HEAD commit.
 */
function gitHead(execaOpts) {
  return execa.stdout('git', ['rev-parse', 'HEAD'], execaOpts);
}

/**
 * Get the repository remote URL.
 *
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {string} The value of the remote git URL.
 */
async function repoUrl(execaOpts) {
  try {
    return await execa.stdout('git', ['config', '--get', 'remote.origin.url'], execaOpts);
  } catch (error) {
    debug(error);
  }
}

/**
 * Test if the current working directory is a Git repository.
 *
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {Boolean} `true` if the current working directory is in a git repository, falsy otherwise.
 */
async function isGitRepo(execaOpts) {
  try {
    return (await execa('git', ['rev-parse', '--git-dir'], execaOpts)).code === 0;
  } catch (error) {
    debug(error);
  }
}

/**
 * Verify the write access authorization to remote repository with push dry-run.
 *
 * @param {String} repositoryUrl The remote repository URL.
 * @param {String} branch The repositoru branch for which to verify write access.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @throws {Error} if not authorized to push.
 */
async function verifyAuth(repositoryUrl, branch, execaOpts) {
  try {
    await execa('git', ['push', '--dry-run', repositoryUrl, `HEAD:${branch}`], execaOpts);
  } catch (error) {
    debug(error);
    throw error;
  }
}

/**
 * Tag the commit head on the local repository.
 *
 * @param {String} tagName The name of the tag.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @throws {Error} if the tag creation failed.
 */
async function tag(tagName, execaOpts) {
  await execa('git', ['tag', tagName], execaOpts);
}

/**
 * Push to the remote repository.
 *
 * @param {String} repositoryUrl The remote repository URL.
 * @param {String} branch The branch to push.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @throws {Error} if the push failed.
 */
async function push(repositoryUrl, branch, execaOpts) {
  await execa('git', ['push', '--tags', repositoryUrl, `HEAD:${branch}`], execaOpts);
}

/**
 * Verify a tag name is a valid Git reference.
 *
 * @param {string} tagName the tag name to verify.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {boolean} `true` if valid, falsy otherwise.
 */
async function verifyTagName(tagName, execaOpts) {
  try {
    return (await execa('git', ['check-ref-format', `refs/tags/${tagName}`], execaOpts)).code === 0;
  } catch (error) {
    debug(error);
  }
}

/**
 * Verify the local branch is up to date with the remote one.
 *
 * @param {String} branch The repository branch for which to verify status.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {Boolean} `true` is the HEAD of the current local branch is the same as the HEAD of the remote branch, falsy otherwise.
 */
async function isBranchUpToDate(branch, execaOpts) {
  const remoteHead = await execa.stdout('git', ['ls-remote', '--heads', 'origin', branch], execaOpts);
  try {
    return await isRefInHistory(remoteHead.match(/^(\w+)?/)[1], execaOpts);
  } catch (error) {
    debug(error);
  }
}

module.exports = {
  gitTagHead,
  gitTags,
  isRefInHistory,
  fetch,
  gitHead,
  repoUrl,
  isGitRepo,
  verifyAuth,
  tag,
  push,
  verifyTagName,
  isBranchUpToDate,
};

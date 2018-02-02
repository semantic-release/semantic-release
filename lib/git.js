const execa = require('execa');
const debug = require('debug')('semantic-release:get-version-head');

/**
 * Get the commit sha for a given tag.
 *
 * @param {string} tagName Tag name for which to retrieve the commit sha.
 *
 * @return {string} The commit sha of the tag in parameter or `null`.
 */
async function gitTagHead(tagName) {
  try {
    return await execa.stdout('git', ['rev-list', '-1', tagName]);
  } catch (err) {
    debug(err);
  }
}

/**
 * @return {Array<String>} List of git tags.
 * @throws {Error} If the `git` command fails.
 */
async function gitTags() {
  return (await execa.stdout('git', ['tag']))
    .split('\n')
    .map(tag => tag.trim())
    .filter(tag => Boolean(tag));
}

/**
 * Verify if the `ref` is in the direct history of the current branch.
 *
 * @param {string} ref The reference to look for.
 *
 * @return {boolean} `true` if the reference is in the history of the current branch, falsy otherwise.
 */
async function isRefInHistory(ref) {
  try {
    return (await execa('git', ['merge-base', '--is-ancestor', ref, 'HEAD'])).code === 0;
  } catch (err) {
    debug(err);
  }
}

/**
 * Unshallow the git repository (retriving every commits and tags).
 */
async function unshallow() {
  await execa('git', ['fetch', '--unshallow', '--tags'], {reject: false});
}

/**
 * @return {string} the sha of the HEAD commit.
 */
async function gitHead() {
  return execa.stdout('git', ['rev-parse', 'HEAD']);
}

/**
 * @return {string} The value of the remote git URL.
 */
async function repoUrl() {
  try {
    return await execa.stdout('git', ['remote', 'get-url', 'origin']);
  } catch (err) {
    debug(err);
  }
}

/**
 * @return {Boolean} `true` if the current working directory is in a git repository, falsy otherwise.
 */
async function isGitRepo() {
  try {
    return (await execa('git', ['rev-parse', '--git-dir'])).code === 0;
  } catch (err) {
    debug(err);
  }
}

/**
 * Verify the write access authorization to remote repository with push dry-run.
 *
 * @param {String} origin The remote repository URL.
 * @param {String} branch The repositoru branch for which to verify write access.
 *
 * @return {Boolean} `true` is authorized to push, falsy otherwise.
 */
async function verifyAuth(origin, branch) {
  try {
    return (await execa('git', ['push', '--dry-run', origin, `HEAD:${branch}`])).code === 0;
  } catch (err) {
    debug(err);
  }
}

/**
 * Tag the commit head on the local repository.
 *
 * @param {String} tagName The name of the tag.
 * @throws {Error} if the tag creation failed.
 */
async function tag(tagName) {
  await execa('git', ['tag', tagName]);
}

/**
 * Push to the remote repository.
 *
 * @param {String} origin The remote repository URL.
 * @param {String} branch The branch to push.
 * @throws {Error} if the push failed.
 */
async function push(origin, branch) {
  await execa('git', ['push', '--tags', origin, `HEAD:${branch}`]);
}

/**
 * Delete a tag locally and remotely.
 *
 * @param {String} origin The remote repository URL.
 * @param {String} tagName The tag name to delete.
 */
async function deleteTag(origin, tagName) {
  // Delete the local tag
  let shell = await execa('git', ['tag', '-d', tagName], {reject: false});
  debug('delete local tag', shell);

  // Delete the tag remotely
  shell = await execa('git', ['push', '--delete', origin, tagName], {reject: false});
  debug('delete remote tag', shell);
}

/**
 * Verify a tag name is a valid Git reference.
 *
 * @method verifyTagName
 * @param {string} tagName the tag name to verify.
 * @return {boolean} `true` if valid, falsy otherwise.
 */
async function verifyTagName(tagName) {
  try {
    return (await execa('git', ['check-ref-format', `refs/tags/${tagName}`])).code === 0;
  } catch (err) {
    debug(err);
  }
}

module.exports = {
  gitTagHead,
  gitTags,
  isRefInHistory,
  unshallow,
  gitHead,
  repoUrl,
  isGitRepo,
  verifyAuth,
  tag,
  push,
  deleteTag,
  verifyTagName,
};

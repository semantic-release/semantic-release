const {matches, pick, memoize} = require('lodash');
const gitLogParser = require('git-log-parser');
const getStream = require('get-stream');
const execa = require('execa');
const debug = require('debug')('semantic-release:git');

Object.assign(gitLogParser.fields, {hash: 'H', message: 'B', gitTags: 'd', committerDate: {key: 'ci', type: Date}});

/**
 * Get the commit sha for a given tag.
 *
 * @param {String} tagName Tag name for which to retrieve the commit sha.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {String} The commit sha of the tag in parameter or `null`.
 */
async function getTagHead(tagName, execaOpts) {
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
async function getTags(execaOpts) {
  return (await execa.stdout('git', ['tag'], execaOpts))
    .split('\n')
    .map(tag => tag.trim())
    .filter(Boolean);
}

/**
 * Retrieve a range of commits.
 *
 * @param {String} from to includes all commits made after this sha (does not include this sha).
 * @param {String} to to includes all commits made before this sha (also include this sha).
 * @param {Object} [execaOpts] Options to pass to `execa`.
 * @return {Promise<Array<Object>>} The list of commits between `from` and `to`.
 */
async function getCommits(from, to, execaOpts) {
  return (await getStream.array(
    gitLogParser.parse(
      {_: `${from ? from + '..' : ''}${to}`},
      {cwd: execaOpts.cwd, env: {...process.env, ...execaOpts.env}}
    )
  )).map(({message, gitTags, ...commit}) => ({...commit, message: message.trim(), gitTags: gitTags.trim()}));
}

/**
 * Get all the repository branches.
 *
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {Array<String>} List of git branches.
 * @throws {Error} If the `git` command fails.
 */
async function getBranches(execaOpts) {
  return (await execa.stdout('git', ['ls-remote', '--heads', 'origin'], execaOpts))
    .split('\n')
    .map(branch => branch.match(/^.+refs\/heads\/(.+)$/)[1])
    .filter(Boolean);
}

const getBranchCommits = memoize((branch, execaOpts) =>
  getStream.array(gitLogParser.parse({_: branch}, {cwd: execaOpts.cwd, env: {...process.env, ...execaOpts.env}}))
);

/**
 * Verify if the `ref` is in the direct history of a given branch.
 *
 * @param {String} ref The reference to look for.
 * @param {String} branch The branch for which to check if the `ref` is in history.
 * @param {Boolean} findRebasedTags Weither consider in history tags associated with a commit that was rebased to another branch (i.e. GitHub Rebase and Merge feature).
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {Boolean} `true` if the reference is in the history of the current branch, falsy otherwise.
 */
async function isRefInHistory(ref, branch, findRebasedTags, execaOpts) {
  if (!(await isRefExists(branch, execaOpts))) {
    return false;
  }

  try {
    await execa('git', ['merge-base', '--is-ancestor', ref, branch], execaOpts);
    return true;
  } catch (error) {
    if (error.code === 1) {
      if (findRebasedTags) {
        const [tagCommit] = await getStream.array(
          gitLogParser.parse({_: ref, n: '1'}, {cwd: execaOpts.cwd, env: {...process.env, ...execaOpts.env}})
        );
        return (await getBranchCommits(branch, execaOpts)).some(matches(pick(tagCommit, ['message', 'author'])));
      }

      return false;
    }

    debug(error);
    throw error;
  }
}

/**
 * Verify if the `ref` exits
 *
 * @param {String} ref The reference to verify.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {Boolean} `true` if the reference exists, falsy otherwise.
 */
async function isRefExists(ref, execaOpts) {
  try {
    return (await execa('git', ['rev-parse', '--verify', ref], execaOpts)).code === 0;
  } catch (error) {
    debug(error);
  }
}

/**
 * Unshallow the git repository if necessary and fetch all the tags.
 *
 * @param {String} branch The repository branch to fetch.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 */
async function fetch(branch, execaOpts) {
  const isLocalExists =
    (await execa('git', ['rev-parse', '--verify', branch], {...execaOpts, reject: false})).code === 0;

  try {
    await execa(
      'git',
      [
        'fetch',
        '--unshallow',
        '--tags',
        ...(isLocalExists ? [] : ['origin', `+refs/heads/${branch}:refs/heads/${branch}`]),
      ],
      execaOpts
    );
  } catch (error) {
    await execa(
      'git',
      ['fetch', '--tags', ...(isLocalExists ? [] : ['origin', `+refs/heads/${branch}:refs/heads/${branch}`])],
      execaOpts
    );
  }
}

/**
 * Get the HEAD sha.
 *
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {String} the sha of the HEAD commit.
 */
function getGitHead(execaOpts) {
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
 * @param {String} branch The repository branch for which to verify write access.
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
 * @param {String} ref The Git reference to tag.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @throws {Error} if the tag creation failed.
 */
async function tag(tagName, ref, execaOpts) {
  await execa('git', ['tag', tagName, ref], execaOpts);
}

/**
 * Push to the remote repository.
 *
 * @param {String} repositoryUrl The remote repository URL.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @throws {Error} if the push failed.
 */
async function push(repositoryUrl, execaOpts) {
  await execa('git', ['push', '--tags', repositoryUrl], execaOpts);
}

/**
 * Verify a tag name is a valid Git reference.
 *
 * @param {String} tagName the tag name to verify.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {Boolean} `true` if valid, falsy otherwise.
 */
async function verifyTagName(tagName, execaOpts) {
  try {
    return (await execa('git', ['check-ref-format', `refs/tags/${tagName}`], execaOpts)).code === 0;
  } catch (error) {
    debug(error);
  }
}

/**
 * Verify a branch name is a valid Git reference.
 *
 * @param {String} branch the branch name to verify.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {Boolean} `true` if valid, falsy otherwise.
 */
async function verifyBranchName(branch, execaOpts) {
  try {
    return (await execa('git', ['check-ref-format', `refs/heads/${branch}`], execaOpts)).code === 0;
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
    return await isRefInHistory(remoteHead.match(/^(\w+)?/)[1], branch, false, execaOpts);
  } catch (error) {
    debug(error);
  }
}

module.exports = {
  getTagHead,
  getTags,
  getCommits,
  getBranches,
  isRefInHistory,
  isRefExists,
  fetch,
  getGitHead,
  repoUrl,
  isGitRepo,
  verifyAuth,
  tag,
  push,
  verifyTagName,
  isBranchUpToDate,
  verifyBranchName,
};

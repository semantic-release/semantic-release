const tempy = require('tempy');
const execa = require('execa');
const fileUrl = require('file-url');
const pEachSeries = require('p-each-series');
const gitLogParser = require('git-log-parser');
const getStream = require('get-stream');
const {GIT_NOTE_REF} = require('../../lib/definitions/constants');

/**
 * Commit message information.
 *
 * @typedef {Object} Commit
 * @property {String} branch The commit branch.
 * @property {String} hash The commit hash.
 * @property {String} message The commit message.
 */

/**
 * Initialize git repository
 * If `withRemote` is `true`, creates a bare repository and initialize it.
 * If `withRemote` is `false`, creates a regular repository and initialize it.
 *
 * @param {Boolean} withRemote `true` to create a shallow clone of a bare repository.
 * @return {String} The path of the repository
 */
async function initGit(withRemote) {
  const cwd = tempy.directory();
  const args = withRemote ? ['--bare', '--initial-branch=master'] : ['--initial-branch=master'];

  await execa('git', ['init', ...args], {cwd}).catch(() => {
    const args = withRemote ? ['--bare'] : [];
    return execa('git', ['init', ...args], {cwd});
  });
  const repositoryUrl = fileUrl(cwd);
  return {cwd, repositoryUrl};
}

/**
 * Create a temporary git repository.
 * If `withRemote` is `true`, creates a shallow clone. Change the current working directory to the clone root.
 * If `withRemote` is `false`, just change the current working directory to the repository root.
 *
 *
 * @param {Boolean} withRemote `true` to create a shallow clone of a bare repository.
 * @param {String} [branch='master'] The branch to initialize.
 * @return {String} The path of the clone if `withRemote` is `true`, the path of the repository otherwise.
 */
async function gitRepo(withRemote, branch = 'master') {
  let {cwd, repositoryUrl} = await initGit(withRemote);
  if (withRemote) {
    await initBareRepo(repositoryUrl, branch);
    cwd = await gitShallowClone(repositoryUrl, branch);
  } else {
    await gitCheckout(branch, true, {cwd});
  }

  await execa('git', ['config', 'commit.gpgsign', false], {cwd});

  return {cwd, repositoryUrl};
}

/**
 * Initialize an existing bare repository:
 * - Clone the repository
 * - Change the current working directory to the clone root
 * - Create a default branch
 * - Create an initial commits
 * - Push to origin
 *
 * @param {String} repositoryUrl The URL of the bare repository.
 * @param {String} [branch='master'] the branch to initialize.
 */
async function initBareRepo(repositoryUrl, branch = 'master') {
  const cwd = tempy.directory();
  await execa('git', ['clone', '--no-hardlinks', repositoryUrl, cwd], {cwd});
  await gitCheckout(branch, true, {cwd});
  await gitCommits(['Initial commit'], {cwd});
  await execa('git', ['push', repositoryUrl, branch], {cwd});
}

/**
 * Create commits on the current git repository.
 *
 * @param {Array<string>} messages Commit messages.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @returns {Array<Commit>} The created commits, in reverse order (to match `git log` order).
 */
async function gitCommits(messages, execaOptions) {
  await pEachSeries(
    messages,
    async (message) =>
      (await execa('git', ['commit', '-m', message, '--allow-empty', '--no-gpg-sign'], execaOptions)).stdout
  );
  return (await gitGetCommits(undefined, execaOptions)).slice(0, messages.length);
}

/**
 * Get the list of parsed commits since a git reference.
 *
 * @param {String} [from] Git reference from which to seach commits.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {Array<Object>} The list of parsed commits.
 */
async function gitGetCommits(from, execaOptions) {
  Object.assign(gitLogParser.fields, {hash: 'H', message: 'B', gitTags: 'd', committerDate: {key: 'ci', type: Date}});
  return (
    await getStream.array(
      gitLogParser.parse(
        {_: `${from ? from + '..' : ''}HEAD`},
        {...execaOptions, env: {...process.env, ...execaOptions.env}}
      )
    )
  ).map((commit) => {
    commit.message = commit.message.trim();
    commit.gitTags = commit.gitTags.trim();
    return commit;
  });
}

/**
 * Checkout a branch on the current git repository.
 *
 * @param {String} branch Branch name.
 * @param {Boolean} create to create the branch, `false` to checkout an existing branch.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 */
async function gitCheckout(branch, create, execaOptions) {
  await execa('git', create ? ['checkout', '-b', branch] : ['checkout', branch], execaOptions);
}

/**
 * Fetch current git repository.
 *
 * @param {String} repositoryUrl The repository remote URL.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 */
async function gitFetch(repositoryUrl, execaOptions) {
  await execa('git', ['fetch', repositoryUrl], execaOptions);
}

/**
 * Reset the current branch.
 *
 * @param {String} head A commit sha of the remote repo that will become the detached head of the new one.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 */
async function gitReset(head, execaOptions) {
  await execa('git', ['reset', '--hard', head], execaOptions);
}

/**
 * Get the HEAD sha.
 *
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {String} The sha of the head commit in the current git repository.
 */
async function gitHead(execaOptions) {
  return (await execa('git', ['rev-parse', 'HEAD'], execaOptions)).stdout;
}

/**
 * Create a tag on the head commit in the current git repository.
 *
 * @param {String} tagName The tag name to create.
 * @param {String} [sha] The commit on which to create the tag. If undefined the tag is created on the last commit.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 */
async function gitTagVersion(tagName, sha, execaOptions) {
  await execa('git', sha ? ['tag', '-f', tagName, sha] : ['tag', tagName], execaOptions);
}

/**
 * Create a shallow clone of a git repository and change the current working directory to the cloned repository root.
 * The shallow will contain a limited number of commit and no tags.
 *
 * @param {String} repositoryUrl The path of the repository to clone.
 * @param {String} [branch='master'] the branch to clone.
 * @param {Number} [depth=1] The number of commit to clone.
 * @return {String} The path of the cloned repository.
 */
async function gitShallowClone(repositoryUrl, branch = 'master', depth = 1) {
  const cwd = tempy.directory();

  await execa('git', ['clone', '--no-hardlinks', '--no-tags', '-b', branch, '--depth', depth, repositoryUrl, cwd], {
    cwd,
  });
  return cwd;
}

/**
 * Create a git repo with a detached head from another git repository and change the current working directory to the new repository root.
 *
 * @param {String} repositoryUrl The path of the repository to clone.
 * @param {Number} head A commit sha of the remote repo that will become the detached head of the new one.
 * @return {String} The path of the new repository.
 */
async function gitDetachedHead(repositoryUrl, head) {
  const cwd = tempy.directory();

  await execa('git', ['init'], {cwd});
  await execa('git', ['remote', 'add', 'origin', repositoryUrl], {cwd});
  await execa('git', ['fetch', repositoryUrl], {cwd});
  await execa('git', ['checkout', head], {cwd});
  return cwd;
}

async function gitDetachedHeadFromBranch(repositoryUrl, branch, head) {
  const cwd = tempy.directory();

  await execa('git', ['init'], {cwd});
  await execa('git', ['remote', 'add', 'origin', repositoryUrl], {cwd});
  await execa('git', ['fetch', '--force', repositoryUrl, `${branch}:remotes/origin/${branch}`], {cwd});
  await execa('git', ['reset', '--hard', head], {cwd});
  await execa('git', ['checkout', '-q', '-B', branch], {cwd});
  return cwd;
}

/**
 * Add a new Git configuration.
 *
 * @param {String} name Config name.
 * @param {String} value Config value.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 */
async function gitAddConfig(name, value, execaOptions) {
  await execa('git', ['config', '--add', name, value], execaOptions);
}

/**
 * Get the first commit sha referenced by the tag `tagName` in the local repository.
 *
 * @param {String} tagName Tag name for which to retrieve the commit sha.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {String} The sha of the commit associated with `tagName` on the local repository.
 */
async function gitTagHead(tagName, execaOptions) {
  return (await execa('git', ['rev-list', '-1', tagName], execaOptions)).stdout;
}

/**
 * Get the first commit sha referenced by the tag `tagName` in the remote repository.
 *
 * @param {String} repositoryUrl The repository remote URL.
 * @param {String} tagName The tag name to seach for.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {String} The sha of the commit associated with `tagName` on the remote repository.
 */
async function gitRemoteTagHead(repositoryUrl, tagName, execaOptions) {
  return (await execa('git', ['ls-remote', '--tags', repositoryUrl, tagName], execaOptions)).stdout
    .split('\n')
    .filter((tag) => Boolean(tag))
    .map((tag) => tag.match(/^(?<tag>\S+)/)[1])[0];
}

/**
 * Get the tag associated with a commit sha.
 *
 * @param {String} gitHead The commit sha for which to retrieve the associated tag.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 *
 * @return {String} The tag associatedwith the sha in parameter or `null`.
 */
async function gitCommitTag(gitHead, execaOptions) {
  return (await execa('git', ['describe', '--tags', '--exact-match', gitHead], execaOptions)).stdout;
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
async function gitPush(repositoryUrl, branch, execaOptions) {
  await execa('git', ['push', '--tags', repositoryUrl, `HEAD:${branch}`], execaOptions);
}

/**
 * Merge a branch into the current one with `git merge`.
 *
 * @param {String} ref The ref to merge.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 */
async function merge(ref, execaOptions) {
  await execa('git', ['merge', '--no-ff', ref], execaOptions);
}

/**
 * Merge a branch into the current one with `git merge --ff`.
 *
 * @param {String} ref The ref to merge.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 */
async function mergeFf(ref, execaOptions) {
  await execa('git', ['merge', '--ff', ref], execaOptions);
}

/**
 * Merge a branch into the current one with `git rebase`.
 *
 * @param {String} ref The ref to merge.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 */
async function rebase(ref, execaOptions) {
  await execa('git', ['rebase', ref], execaOptions);
}

/**
 * Add a note to a Git reference.
 *
 * @param {String} note The note to add.
 * @param {String} ref The ref to add the note to.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 */
async function gitAddNote(note, ref, execaOptions) {
  await execa('git', ['notes', '--ref', GIT_NOTE_REF, 'add', '-m', note, ref], execaOptions);
}

/**
 * Get the note associated with a Git reference.
 *
 * @param {String} ref The ref to get the note from.
 * @param {Object} [execaOpts] Options to pass to `execa`.
 */
async function gitGetNote(ref, execaOptions) {
  return (await execa('git', ['notes', '--ref', GIT_NOTE_REF, 'show', ref], execaOptions)).stdout;
}

module.exports = {
  initGit,
  gitRepo,
  initBareRepo,
  gitCommits,
  gitGetCommits,
  gitCheckout,
  gitFetch,
  gitReset,
  gitHead,
  gitTagVersion,
  gitShallowClone,
  gitDetachedHead,
  gitDetachedHeadFromBranch,
  gitAddConfig,
  gitTagHead,
  gitRemoteTagHead,
  gitCommitTag,
  gitPush,
  merge,
  mergeFf,
  rebase,
  gitAddNote,
  gitGetNote,
};

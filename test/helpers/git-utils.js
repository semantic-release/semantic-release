import tempy from 'tempy';
import execa from 'execa';
import fileUrl from 'file-url';
import pReduce from 'p-reduce';
import gitLogParser from 'git-log-parser';
import getStream from 'get-stream';

/**
 * Commit message informations.
 *
 * @typedef {Object} Commit
 * @property {String} branch The commit branch.
 * @property {String} hash The commit hash.
 * @property {String} message The commit message.
 */

/**
 * Create a temporary git repository.
 * If `withRemote` is `true`, creates a bare repository, initialize it and create a shallow clone. Change the current working directory to the clone root.
 * If `withRemote` is `false`, creates a regular repository and initialize it. Change the current working directory to the repository root.
 *
 * @param {Boolean} withRemote `true` to create a shallow clone of a bare repository.
 * @param {String} [branch='master'] The branch to initialize.
 * @return {String} The path of the clone if `withRemote` is `true`, the path of the repository otherwise.
 */
export async function gitRepo(withRemote, branch = 'master') {
  const dir = tempy.directory();

  process.chdir(dir);
  await execa('git', ['init'].concat(withRemote ? ['--bare'] : []));

  if (withRemote) {
    await initBareRepo(fileUrl(dir), branch);
    await gitShallowClone(fileUrl(dir));
  } else {
    await gitCheckout(branch);
  }
  return fileUrl(dir);
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
export async function initBareRepo(repositoryUrl, branch = 'master') {
  const clone = tempy.directory();
  await execa('git', ['clone', '--no-hardlinks', repositoryUrl, clone]);
  process.chdir(clone);
  await gitCheckout(branch);
  await gitCommits(['Initial commit']);
  await execa('git', ['push', repositoryUrl, branch]);
}

/**
 * Create commits on the current git repository.
 *
 * @param {Array<string>} messages commit messages.
 *
 * @returns {Array<Commit>} The created commits, in reverse order (to match `git log` order).
 */
export async function gitCommits(messages) {
  await pReduce(
    messages,
    async (commits, msg) => {
      const stdout = await execa.stdout('git', ['commit', '-m', msg, '--allow-empty', '--no-gpg-sign']);
      const [, hash] = /^\[(?:\w+)\(?.*?\)?(\w+)\] .+(?:\n|$)/.exec(stdout);
      commits.push(hash);
      return commits;
    },
    []
  );
  return (await gitGetCommits()).slice(0, messages.length);
}

/**
 * Get the list of parsed commits since a git reference.
 *
 * @param {String} [from] Git reference from which to seach commits.
 * @return {Array<Object>} The list of parsed commits.
 */
export async function gitGetCommits(from) {
  Object.assign(gitLogParser.fields, {hash: 'H', message: 'B', gitTags: 'd', committerDate: {key: 'ci', type: Date}});
  return (await getStream.array(gitLogParser.parse({_: `${from ? from + '..' : ''}HEAD`}))).map(commit => {
    commit.message = commit.message.trim();
    commit.gitTags = commit.gitTags.trim();
    return commit;
  });
}

/**
 * Checkout a branch on the current git repository.
 *
 * @param {String} branch Branch name.
 * @param {Boolean} create `true` to create the branche ans switch, `false` to only switch.
 */
export async function gitCheckout(branch, create = true) {
  await execa('git', create ? ['checkout', '-b', branch] : ['checkout', branch]);
}

/**
 * @return {String} The sha of the head commit in the current git repository.
 */
export async function gitHead() {
  return execa.stdout('git', ['rev-parse', 'HEAD']);
}

/**
 * Create a tag on the head commit in the current git repository.
 *
 * @param {String} tagName The tag name to create.
 * @param {String} [sha] The commit on which to create the tag. If undefined the tag is created on the last commit.
 */
export async function gitTagVersion(tagName, sha) {
  await execa('git', sha ? ['tag', '-f', tagName, sha] : ['tag', tagName]);
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
export async function gitShallowClone(repositoryUrl, branch = 'master', depth = 1) {
  const dir = tempy.directory();

  process.chdir(dir);
  await execa('git', ['clone', '--no-hardlinks', '--no-tags', '-b', branch, '--depth', depth, repositoryUrl, dir]);
  return dir;
}

/**
 * Create a git repo with a detached head from another git repository and change the current working directory to the new repository root.
 *
 * @param {String} repositoryUrl The path of the repository to clone.
 * @param {Number} head A commit sha of the remote repo that will become the detached head of the new one.
 * @return {String} The path of the new repository.
 */
export async function gitDetachedHead(repositoryUrl, head) {
  const dir = tempy.directory();

  process.chdir(dir);
  await execa('git', ['init']);
  await execa('git', ['remote', 'add', 'origin', repositoryUrl]);
  await execa('git', ['fetch']);
  await execa('git', ['checkout', head]);
  return dir;
}

/**
 * Add a new Git configuration.
 *
 * @param {String} name Config name.
 * @param {String} value Config value.
 */
export async function gitAddConfig(name, value) {
  await execa('git', ['config', '--add', name, value]);
}

/**
 * Get the first commit sha referenced by the tag `tagName` in the local repository.
 *
 * @param {String} tagName Tag name for which to retrieve the commit sha.
 *
 * @return {String} The sha of the commit associated with `tagName` on the local repository.
 */
export async function gitTagHead(tagName) {
  return execa.stdout('git', ['rev-list', '-1', tagName]);
}

/**
 * Get the first commit sha referenced by the tag `tagName` in the remote repository.
 *
 * @param {String} repositoryUrl The repository remote URL.
 * @param {String} tagName The tag name to seach for.
 * @return {String} The sha of the commit associated with `tagName` on the remote repository.
 */
export async function gitRemoteTagHead(repositoryUrl, tagName) {
  return (await execa.stdout('git', ['ls-remote', '--tags', repositoryUrl, tagName]))
    .split('\n')
    .filter(tag => Boolean(tag))
    .map(tag => tag.match(/^(\S+)/)[1])[0];
}

/**
 * Get the tag associated with a commit sha.
 *
 * @param {String} gitHead The commit sha for which to retrieve the associated tag.
 *
 * @return {String} The tag associatedwith the sha in parameter or `null`.
 */
export async function gitCommitTag(gitHead) {
  return execa.stdout('git', ['describe', '--tags', '--exact-match', gitHead]);
}

/**
 * Push to the remote repository.
 *
 * @param {String} repositoryUrl The remote repository URL.
 * @param {String} branch The branch to push.
 * @throws {Error} if the push failed.
 */
export async function push(repositoryUrl = 'origin', branch = 'master') {
  await execa('git', ['push', '--tags', repositoryUrl, `HEAD:${branch}`]);
}

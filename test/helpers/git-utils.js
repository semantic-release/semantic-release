import tempy from 'tempy';
import execa from 'execa';
import pMapSeries from 'p-map-series';

/**
 * Commit message informations.
 *
 * @typedef {Object} Commit
 * @property {string} branch The commit branch.
 * @property {string} hash The commit hash.
 * @property {string} message The commit message.
 */

/**
 * Create a temporary git repository and change the current working directory to the repository root.
 *
 * @return {string} The path of the repository.
 */
export async function gitRepo() {
  const dir = tempy.directory();

  process.chdir(dir);
  await execa('git', ['init']);
  await gitCheckout('master');
  return dir;
}

/**
 * Create commits on the current git repository.
 *
 * @param {Array<string>} messages commit messages.
 *
 * @returns {Array<Commit>} The created commits, in reverse order (to match `git log` order).
 */
export async function gitCommits(messages) {
  return (await pMapSeries(messages, async msg => {
    const {stdout} = await execa('git', ['commit', '-m', msg, '--allow-empty', '--no-gpg-sign']);
    const [, branch, hash, message] = /^\[(\w+)\(?.*?\)?(\w+)\] (.+)$/.exec(stdout);
    return {branch, hash, message};
  })).reverse();
}

/**
 * Amend a commit (rewriting the sha) on the current git repository.
 *
 * @param {string} messages commit message.
 *
 * @returns {Array<Commit>} the created commits.
 */
export async function gitAmmendCommit(msg) {
  const {stdout} = await execa('git', ['commit', '--amend', '-m', msg, '--allow-empty']);
  const [, branch, hash, message] = /^\[(\w+)\(?.*?\)?(\w+)\] (.+)(.|\s)+$/.exec(stdout);
  return {branch, hash, message};
}

/**
 * Checkout a branch on the current git repository.
 *
 * @param {string} branch Branch name.
 * @param {boolean} create `true` to create the branche ans switch, `false` to only switch.
 */
export async function gitCheckout(branch, create = true) {
  await execa('git', create ? ['checkout', '-b', branch] : ['checkout', branch]);
}

/**
 * @return {string} The sha of the head commit in the current git repository.
 */
export async function gitHead() {
  return (await execa('git', ['rev-parse', 'HEAD'])).stdout;
}

/**
 * Create a tag on the head commit in the current git repository.
 *
 * @param {string} tagName The tag name to create.
 * @param {string} [sha] The commit on which to create the tag. If undefined the tag is created on the last commit.
 *
 * @return {string} The commit sha of the created tag.
 */
export async function gitTagVersion(tagName, sha) {
  await execa('git', sha ? ['tag', '-f', tagName, sha] : ['tag', tagName]);
  return (await execa('git', ['rev-list', '-1', '--tags', tagName])).stdout;
}

/**
 * @return {Array<string>} The list of tags from the current git repository.
 */
export async function gitTags() {
  return (await execa('git', ['tag'])).stdout.split('\n').filter(tag => Boolean(tag));
}

/**
 * @return {Array<string>} The list of commit sha from the current git repository.
 */
export async function gitLog() {
  return (await execa('git', ['log', '--format=format:%H'])).stdout.split('\n').filter(sha => Boolean(sha));
}

/**
 * Create a shallow clone of a git repository and change the current working directory to the cloned repository root.
 * The shallow will contain a limited number of commit and no tags.
 *
 * @param {string} origin The path of the repository to clone.
 * @param {number} [depth=1] The number of commit to clone.
 * @return {string} The path of the cloned repository.
 */
export async function gitShallowClone(origin, branch = 'master', depth = 1) {
  const dir = tempy.directory();

  process.chdir(dir);
  await execa('git', ['clone', '--no-hardlinks', '--no-tags', '-b', branch, '--depth', depth, `file://${origin}`, dir]);
  return dir;
}

/**
 * Create a git repo with a detached head from another git repository and change the current working directory to the new repository root.
 *
 * @param {string} origin The path of the repository to clone.
 * @param {number} head A commit sha of the origin repo that will become the detached head of the new one.
 * @return {string} The path of the new repository.
 */
export async function gitDetachedHead(origin, head) {
  const dir = tempy.directory();

  process.chdir(dir);
  await execa('git', ['init']);
  await execa('git', ['remote', 'add', 'origin', origin]);
  await execa('git', ['fetch']);
  await execa('git', ['checkout', head]);
  return dir;
}

/**
 * Pack heads and tags of the current git repository.
 */
export async function gitPackRefs() {
  await execa('git', ['pack-refs', '--all']);
}

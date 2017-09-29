import {mkdir} from 'fs-extra';
import tempy from 'tempy';
import execa from 'execa';
import pMapSeries from 'p-map-series';

/**
 * Commit message informations.
 * 
 * @typedef {Object} Commit
 * @property {string} branch The commit branch
 * @property {string} hash The commit hash
 * @property {string} message The commit message
 */

/**
  * Create a temporary git repository.
  *
  * @method gitCommits
  * @param {Array<Commit>} commits the created commits.
  */
export async function gitRepo() {
  const dir = tempy.directory();

  process.chdir(dir);
  await mkdir('git-templates');
  await execa('git', ['init', '--template=./git-templates']);
}

/**
 * Create commits on the current git repository.
 *
 * @method gitCommits
 * @param {Array<String>} messages commit messages
 * @returns {Array<Commit>} commits the created commits, in reverse order (to match `git log` order)
 */
export async function gitCommits(messages) {
  return (await pMapSeries(messages, async msg => {
    const {stdout} = await execa('git', ['commit', '-m', msg, '--allow-empty', '--no-gpg-sign']);
    const [, branch, hash, message] = /^\[(\w+)\(?.*?\)?(\w+)\] (.+)$/.exec(stdout);
    return {branch, hash, message};
  })).reverse();
}

/**
 * Checkout a branch on the current git repository.
 *
 * @param {String} branch Branch name
 * @param {Boolean} create `true` to create the branche ans switch, `false` to only switch
 */
export async function gitCheckout(branch, create) {
  await execa('git', ['checkout', create ? '-b' : null, branch]);
}

/**
 * Get the sha of the head commit in the current git repository.
 * 
 * @return {String} The sha of the head commit in the current git repository.
 */
export async function gitHead() {
  return (await execa('git', ['rev-parse', 'HEAD'])).stdout;
}

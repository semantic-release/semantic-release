const execa = require('execa');
const log = require('npmlog');
const getVersionHead = require('./get-version-head');

/**
 * Commit message.
 * 
 * @typedef {Object} Commit
 * @property {string} hash The commit hash.
 * @property {string} message The commit message.
 */

/**
 * Retrieve the list of commits on the current branch since the last released version, or all the commits of the current branch if there is no last released version.
 * 
 * The commit correspoding to the last released version is determined as follow:
 * - Use `lastRelease.gitHead` is defined and present in `config.options.branch` history.
 * - Search for a tag named `v<version>` or `<version>` and it's associated commit sha if present in `config.options.branch` history.
 *
 * If a commit corresponding to the last released is not found, unshallow the repository (as most CI create a shallow clone with limited number of commits and no tags) and try again.
 *
 * @param {Object} config
 * @param {Object} config.lastRelease The lastRelease object obtained from the getLastRelease plugin.
 * @param {string} [config.lastRelease.version] The version number of the last release.
 * @param {string} [config.lastRelease.gitHead] The commit sha used to make the last release.
 * @param {Object} config.options The semantic-relese options.
 * @param {string} config.options.branch The branch to release from.
 * 
 * @return {Promise<Array<Commit>>} The list of commits on the branch `config.options.branch` since the last release.
 * 
 * @throws {SemanticReleaseError} with code `ENOTINHISTORY` if `config.lastRelease.gitHead` or the commit sha derived from `config.lastRelease.version` is not in the direct history of `config.options.branch`.
 * @throws {SemanticReleaseError} with code `ENOGITHEAD` if `config.lastRelease.gitHead` is undefined and no commit sha can be found for the `config.lastRelease.version`.
 */
module.exports = async ({lastRelease: {version, gitHead}, options: {branch}}) => {
  if (gitHead || version) {
    try {
      gitHead = await getVersionHead(version, branch, gitHead);
    } catch (err) {
      // Unshallow the repository if the gitHead cannot be found and the branch for the last release version
      await execa('git', ['fetch', '--unshallow', '--tags'], {reject: false});
    }

    // Try to find the gitHead on the branch again with an unshallowed repository
    try {
      gitHead = await getVersionHead(version, branch, gitHead);
    } catch (err) {
      if (err.code === 'ENOTINHISTORY') {
        log.error('commits', notInHistoryMessage(gitHead, branch, version, err.branches));
      } else if (err.code === 'ENOGITHEAD') {
        log.error('commits', noGitHeadMessage());
      }
      throw err;
    }
  } else {
    // If there is no gitHead nor a version, there is no previous release. Unshallow the repo in order to retrieve all commits
    await execa('git', ['fetch', '--unshallow', '--tags'], {reject: false});
  }

  try {
    return (await execa('git', [
      'log',
      '--format=format:%H==SPLIT==%B==END==',
      `${gitHead ? gitHead + '..' : ''}HEAD`,
    ])).stdout
      .split('==END==')
      .filter(raw => !!raw.trim())
      .map(raw => {
        const [hash, message] = raw.trim().split('==SPLIT==');
        return {hash, message};
      });
  } catch (err) {
    return [];
  }
};

function noGitHeadMessage(version) {
  return `The commit the last release of this package was derived from cannot be determined from the release metadata not from the repository tags.
  This means semantic-release can not extract the commits between now and then.
  This is usually caused by releasing from outside the repository directory or with innaccessible git metadata.
  You can recover from this error by publishing manually.`;
}

function notInHistoryMessage(gitHead, branch, version, branches) {
  return `The commit the last release of this package was derived from is not in the direct history of the "${branch}" branch.
  This means semantic-release can not extract the commits between now and then.
  This is usually caused by force pushing, releasing from an unrelated branch, or using an already existing package name.
  You can recover from this error by publishing manually or restoring the commit "${gitHead}".
  
  ${branches && branches.length
    ? `Here is a list of branches that still contain the commit in question: \n * ${branches.join('\n * ')}`
    : ''}`;
}

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
 * - Use `lastRelease.gitHead` if defined and present in `config.options.branch` history.
 * - If `lastRelease.gitHead` is not in the `config.options.branch` history, unshallow the repository and try again.
 * -  If `lastRelease.gitHead` is still not in the `config.options.branch` history, search for a tag named `v<version>` or `<version>` and verify if it's associated commit sha is present in `config.options.branch` history.
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
      gitHead = await getVersionHead(gitHead, version, branch);
    } catch (err) {
      if (err.code === 'ENOTINHISTORY') {
        log.error('commits', notInHistoryMessage(err.gitHead, branch, version));
      } else {
        log.error('commits', noGitHeadMessage(branch, version));
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

function noGitHeadMessage(branch, version) {
  return `The commit the last release of this package was derived from cannot be determined from the release metadata not from the repository tags.
This means semantic-release can not extract the commits between now and then.
This is usually caused by releasing from outside the repository directory or with innaccessible git metadata.

You can recover from this error by creating a tag for the version "${version}" on the commit corresponding to this release:
$ git tag -f v${version} <commit sha1 corresponding to last release>
$ git push -f --tags origin ${branch}
`;
}

function notInHistoryMessage(gitHead, branch, version) {
  return `The commit the last release of this package was derived from is not in the direct history of the "${branch}" branch.
This means semantic-release can not extract the commits between now and then.
This is usually caused by force pushing, releasing from an unrelated branch, or using an already existing package name.

You can recover from this error by restoring the commit "${gitHead}" or by creating a tag for the version "${version}" on the commit corresponding to this release:
$ git tag -f v${version || '<version>'} <commit sha1 corresponding to last release>
$ git push -f --tags origin ${branch}
`;
}

const gitLogParser = require('git-log-parser');
const getStream = require('get-stream');
const debug = require('debug')('semantic-release:get-commits');
const SemanticReleaseError = require('@semantic-release/error');
const {unshallow, gitCommitTag, gitTagHead, isCommitInHistory} = require('./git');

/**
 * Commit message.
 *
 * @typedef {Object} Commit
 * @property {string} hash The commit hash.
 * @property {string} message The commit message.
 */

/**
 * Last release.
 *
 * @typedef {Object} LastRelease
 * @property {string} version The version number of the last release.
 * @property {string} [gitHead] The commit sha used to make the last release.
 * @property {string} [gitTag] The tag used to make the last release.
 */

/**
 * Result object.
 *
 * @typedef {Object} Result
 * @property {Array<Commit>} commits The list of commits since the last release.
 * @property {LastRelease} lastRelease The updated lastRelease.
 */

/**
 * Retrieve the list of commits on the current branch since the last released version, or all the commits of the current branch if there is no last released version.
 *
 * The commit correspoding to the last released version is determined as follow:
 * - Use `lastRelease.gitHead` if defined and present in `branch` history.
 * - If `lastRelease.gitHead` is not in the `branch` history, unshallow the repository and try again.
 * - If `lastRelease.gitHead` is still not in the `branch` history, search for a tag named `v<version>` or `<version>` and verify if it's associated commit sha is present in `branch` history.
 *
 * @param {LastRelease} lastRelease The lastRelease object obtained from the getLastRelease plugin.
 * @param {string} branch The branch to release from.
 * @param {Object} logger Global logger.
 *
 * @return {Promise<Result>} The list of commits on the branch `branch` since the last release and the updated lastRelease with the gitHead used to retrieve the commits.
 *
 * @throws {SemanticReleaseError} with code `ENOTINHISTORY` if `lastRelease.gitHead` or the commit sha derived from `config.lastRelease.version` is not in the direct history of `branch`.
 */
module.exports = async ({version, gitHead} = {}, branch, logger) => {
  if (gitHead) {
    // If gitHead doesn't exists in release branch
    if (!await isCommitInHistory(gitHead)) {
      // Unshallow the repository
      await unshallow();
    }
    // If gitHead still doesn't exists in release branch
    if (!await isCommitInHistory(gitHead)) {
      // Try to find the commit corresponding to the version, using got tags
      const tagHead = (await gitTagHead(`v${version}`)) || (await gitTagHead(version));

      // If tagHead doesn't exists in release branch
      if (!tagHead || !await isCommitInHistory(tagHead)) {
        // Then the commit corresponding to the version cannot be found in the bracnh hsitory
        logger.error(notInHistoryMessage(gitHead, branch, version));
        throw new SemanticReleaseError('Commit not in history', 'ENOTINHISTORY');
      }
      gitHead = tagHead;
    }
    debug('Use gitHead: %s', gitHead);
  } else {
    logger.log('No previous release found, retrieving all commits');
    // If there is no gitHead nor a version, there is no previous release. Unshallow the repo in order to retrieve all commits
    await unshallow();
  }

  Object.assign(gitLogParser.fields, {hash: 'H', message: 'B', gitTags: 'd', committerDate: {key: 'ci', type: Date}});
  const commits = (await getStream.array(gitLogParser.parse({_: `${gitHead ? gitHead + '..' : ''}HEAD`}))).map(
    commit => {
      commit.message = commit.message.trim();
      commit.gitTags = commit.gitTags.trim();
      return commit;
    }
  );
  logger.log('Found %s commits since last release', commits.length);
  debug('Parsed commits: %o', commits);
  return {commits, lastRelease: {version, gitHead, gitTag: await gitCommitTag(gitHead)}};
};

function notInHistoryMessage(gitHead, branch, version) {
  return `The commit the last release of this package was derived from is not in the direct history of the "${branch}" branch.
This means semantic-release can not extract the commits between now and then.
This is usually caused by force pushing, releasing from an unrelated branch, or using an already existing package name.

You can recover from this error by restoring the commit "${gitHead}" or by creating a tag for the version "${version}" on the commit corresponding to this release:
$ git tag -f v${version || '<version>'} <commit sha1 corresponding to last release>
$ git push -f --tags origin ${branch}
`;
}

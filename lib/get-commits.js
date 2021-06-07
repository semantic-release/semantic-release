const debug = require('debug')('semantic-release:get-commits');
const { getCommits } = require('./git');

/**
 * Retrieve the list of commits on the current branch since the commit sha associated with the last release, or all the commits of the current branch if there is no last released version.
 *
 * @param {Object} context semantic-release context.
 *
 * @return {Promise<Array<Object>>} The list of commits on the branch `branch` since the last release.
 */

module.exports = async ({
  cwd,
  env,
  lastRelease: { gitHead: from },
  nextRelease: { gitHead: to = 'HEAD' } = {},
  logger,
  options: { commitPaths } = {},
}) => {
  if (from) {
    debug('Use from: %s', from);
  } else {
    logger.log('No previous release found, retrieving all commits');
  }

  let paths = [];
  if (Array.isArray(commitPaths) && commitPaths.length > 0) {
    logger.log(
      'Commits are being filtered by the commitPaths property: %s',
      ...commitPaths
    );
    paths = ['--', ...commitPaths];
  }

  const commits = await getCommits(from, to, paths, { cwd, env });

  logger.log(`Found ${commits.length} commits since last release`);
  debug('Parsed commits: %o', commits);
  return commits;
};

const debug = require('debug')('semantic-release:get-commits');
const {getCommits} = require('./git');

/**
 * Retrieve the list of commits on the current branch since the commit sha associated with the last release, or all the commits of the current branch if there is no last released version.
 *
 * @param {Object} context semantic-release context.
 *
 * @return {Promise<Array<Object>>} The list of commits on the branch `branch` since the last release.
 */
module.exports = async ({cwd, env, lastRelease: {gitHead: from}, nextRelease: {gitHead: to = 'HEAD'} = {}, logger}) => {
  if (from) {
    debug('Use from: %s', from);
  } else {
    logger.log('No previous release found, retrieving all commits');
  }

  const commits = await getCommits(from, to, {cwd, env});

  logger.log(`Found ${commits.length} commits since last release`);
  debug('Parsed commits: %o', commits);
  return commits;
};

const {identity, memoizeWith} = require('ramda');
const debug = require('debug')('semantic-release:get-commits');
const {getCommits, getCommitFiles} = require('./git');
const memoizedGetCommitFiles = memoizeWith(identity, getCommitFiles);

/**
 * Filter the list of commits with regex for files path
 *
 * @param {Array<Object>} commits commits list
 * @param {String} pathFilter regexp filter
 *
 * @return {Promise<Array<Object>>} The list of filtered commits on the branch `branch` since the last release.
 *
 */
async function filterCommitsWithPath(commits, pathFilter, execaOptions) {

    let commitsWithFiles = await Promise.all(commits.map(async commit => {
        let files = await memoizedGetCommitFiles(commit.hash, execaOptions);
        return {commit: commit, files: files}
    }))

    return commitsWithFiles.filter(commitWithFiles => {

        let files = commitWithFiles.files.filter((file) => {
            if (file.match(pathFilter) != null) {
                // if we found file to include,
                return true
            }
            return false
        })

        if (files.length > 0) {
            return true
        }
        return false

    }).map(commitsWithFiles => commitsWithFiles.commit);
};

/**
 * Retrieve the list of commits on the current branch since the commit sha associated with the last release, or all the commits of the current branch if there is no last released version.
 *
 * @param {Object} context semantic-release context.
 *
 * @return {Promise<Array<Object>>} The list of commits on the branch `branch` since the last release.
 *
 */
module.exports = async ({cwd, env, lastRelease: {gitHead: from}, nextRelease: {gitHead: to = 'HEAD'} = {}, logger, options}) => {
  if (from) {
    debug('Use from: %s', from);
  } else {
    logger.log('No previous release found, retrieving all commits');
  }

  let commits = await getCommits(from, to, {cwd, env});
  if (options.pathFilter != null) {
      commits = await filterCommitsWithPath(commits, options.pathFilter, {cwd, env})
  }
  logger.log(`Found ${commits.length} commits since last release`);
  debug('Parsed commits: %o', commits);
  return commits;
};

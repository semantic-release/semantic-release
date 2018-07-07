const {uniq} = require('lodash');
const semver = require('semver');
const semverDiff = require('semver-diff');
const getLastRelease = require('./get-last-release');
const {makeTag} = require('./utils');

/**
 * Find releases that have been merged from from a higher branch but not added on the channel of the current branch.
 *
 * @param {Object} context semantic-release context.
 *
 * @return {Array<Object>} Last release and next release to be added on the channel of the current branch.
 */
module.exports = context => {
  const {
    branch,
    branches,
    options: {tagFormat},
  } = context;

  return (
    branches
      // Consider only releases of higher branches
      .slice(branches.findIndex(({name}) => name === branch.name) + 1)
      // Exclude prerelease branches
      .filter(({type}) => type !== 'prerelease')
      // Find higher branch releases merged to building branch but not released on associated channel
      .reduce(
        (releases, higherBranch) => [
          ...releases,
          // For all unique release version of the higher branch merged on current branch
          ...uniq(branch.tags.filter(({channel}) => channel === higherBranch.channel))
            // Find ones that are not released on the building branch channel
            .filter(tag =>
              branch.tags.every(
                ({version, channel}) =>
                  version !== tag.version || channel === higherBranch.channel || channel !== branch.channel
              )
            )
            // Sort in ascending order to add the most recent release last
            .sort((a, b) => semver.compare(a.version, b.version))
            // Construct the last and next release to add to the building branch channel
            .map(({version, gitHead, gitTag}) => {
              const lastRelease = getLastRelease(context, {before: version});
              const type = lastRelease.version ? semverDiff(lastRelease.version, version) : 'major';
              const name = makeTag(tagFormat, version);
              return {
                lastRelease,
                currentRelease: {type, version, channel: higherBranch.channel, gitTag, name, gitHead},
                nextRelease: {
                  type,
                  version,
                  channel: branch.channel,
                  gitTag: makeTag(tagFormat, version, branch.channel),
                  name,
                  gitHead,
                },
              };
            }),
        ],
        []
      )
  );
};

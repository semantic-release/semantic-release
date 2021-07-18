const semver = require('semver');
const {FIRST_RELEASE, FIRSTPRERELEASE} = require('./definitions/constants');
const {isSameChannel, getLatestVersion, tagsToVersions, highest, makeTag} = require('./utils');
const {getTagsByGlob} = require('./git');

module.exports = async ({options, cwd, env, branch, nextRelease: {type, channel}, lastRelease, logger}) => {
  let version;
  if (lastRelease.version) {
    const {major, minor, patch} = semver.parse(lastRelease.version);

    if (branch.type === 'prerelease') {
      if (
        semver.prerelease(lastRelease.version) &&
        lastRelease.channels.some((lastReleaseChannel) => isSameChannel(lastReleaseChannel, channel))
      ) {
        version = highest(
          semver.inc(lastRelease.version, 'prerelease'),
          `${semver.inc(getLatestVersion(tagsToVersions(branch.tags), {withPrerelease: true}), type)}-${
            branch.prerelease
          }.${FIRSTPRERELEASE}`
        );
      } else {
        version = `${semver.inc(`${major}.${minor}.${patch}`, type)}-${branch.prerelease}.${FIRSTPRERELEASE}`;
      }
    } else {
      version = semver.inc(lastRelease.version, type);
    }

    logger.log('The next release version is %s', version);
  } else {
    version = branch.type === 'prerelease' ? `${FIRST_RELEASE}-${branch.prerelease}.${FIRSTPRERELEASE}` : FIRST_RELEASE;
    logger.log(`There is no previous release, the next release version is ${version}`);
  }

  if (branch.type === 'prerelease') {
    const {major, minor, patch, prerelease} = semver.parse(version);
    const prereleaseGlob = `${major}.${minor}.${patch}-${prerelease.slice(0, -1)}.*`;
    const tagGlob = makeTag(options.tagFormat, prereleaseGlob);
    const matchingTags = await getTagsByGlob(tagGlob, {cwd, env});
    const [latestMatchingTag] = semver.rsort(matchingTags);
    if (latestMatchingTag) {
      version = semver.inc(latestMatchingTag, 'prerelease');
      logger.log('Found %s, adjusting the next pre-release version to be %s', latestMatchingTag, version);
    }
  }

  return version;
};

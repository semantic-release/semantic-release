const semver = require('semver');
const {FIRST_RELEASE, FIRSTPRERELEASE} = require('./definitions/constants');
const {isSameChannel} = require('./utils');

module.exports = ({branch, nextRelease: {channel}, lastRelease, logger}) => {
  const prereleaseId = branch.prerelease || 'build';
  let version;

  if (lastRelease.version) {
    const {major, minor, patch} = semver.parse(lastRelease.version);

    if (
      semver.prerelease(lastRelease.version) &&
      lastRelease.channels.some((lastReleaseChannel) => isSameChannel(lastReleaseChannel, channel))
    ) {
      // Always only increment the build number — never touch major/minor/patch
      version = semver.inc(lastRelease.version, 'prerelease');
    } else {
      // First release on this channel: preserve existing major.minor.patch, start build at 1
      version = `${major}.${minor}.${patch}-${prereleaseId}.${FIRSTPRERELEASE}`;
    }

    logger.log('The next release version is %s', version);
  } else {
    version = `${FIRST_RELEASE}-${prereleaseId}.${FIRSTPRERELEASE}`;
    logger.log(`There is no previous release, the next release version is ${version}`);
  }

  return version;
};

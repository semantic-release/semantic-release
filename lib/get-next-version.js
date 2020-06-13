const semver = require('semver');
const {FIRST_RELEASE, FIRST_RELEASE_UNSTABLE, FIRSTPRERELEASE} = require('./definitions/constants');
const {isSameChannel, getLatestVersion, tagsToVersions, highest} = require('./utils');

module.exports = ({branch, nextRelease: {type, channel}, lastRelease, logger, options}) => {
  const unstable = Boolean(options && options.unstable);
  let version;
  if (lastRelease.version) {
    const {major, minor, patch} = semver.parse(lastRelease.version);

    if (unstable && major < 1) {
      if (type === 'major') {
        type = 'minor';
      } else if (type === 'minor') {
        type = 'patch';
      }
    }

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
    const firstRelease = unstable ? FIRST_RELEASE_UNSTABLE : FIRST_RELEASE;
    version = branch.type === 'prerelease' ? `${firstRelease}-${branch.prerelease}.${FIRSTPRERELEASE}` : firstRelease;
    logger.log(`There is no previous release, the next release version is ${version}`);
  }

  return version;
};

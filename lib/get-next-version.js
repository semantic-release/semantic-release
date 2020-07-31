const semver = require('semver');
const {FIRST_RELEASE, FIRSTPRERELEASE} = require('./definitions/constants');
const {isSameChannel, getLatestVersion, tagsToVersions, highest, makePrereleaseVersion} = require('./utils');

module.exports = ({branch, nextRelease: {type, channel}, lastRelease, logger, options: {prereleaseVersionFormat}}) => {
  let version;
  if (lastRelease.version) {
    const {major, minor, patch} = semver.parse(lastRelease.version);

    if (branch.type === 'prerelease') {
      if (
        semver.prerelease(lastRelease.version) &&
        lastRelease.channels.some((lastReleaseChannel) => isSameChannel(lastReleaseChannel, channel))
      ) {
        const lastReleaseVersion = semver.inc(lastRelease.version, 'prerelease');
        let nextReleaseVersion = semver.inc(
          getLatestVersion(tagsToVersions(branch.tags), {withPrerelease: true}),
          type
        );
        nextReleaseVersion = makePrereleaseVersion(
          prereleaseVersionFormat,
          nextReleaseVersion,
          branch.prerelease,
          FIRSTPRERELEASE
        );

        version = highest(lastReleaseVersion, nextReleaseVersion);
      } else {
        // Version = `${semver.inc(`${major}.${minor}.${patch}`, type)}-${branch.prerelease}.${FIRSTPRERELEASE}`;
        version = semver.inc(`${major}.${minor}.${patch}`, type);
        version = makePrereleaseVersion(prereleaseVersionFormat, version, branch.prerelease, FIRSTPRERELEASE);
      }
    } else {
      version = semver.inc(lastRelease.version, type);
    }

    logger.log('The next release version is %s', version);
  } else {
    if (branch.type === 'prerelease') {
      // Version = `${FIRST_RELEASE}-${branch.prerelease}.${FIRSTPRERELEASE}`;
      version = makePrereleaseVersion(prereleaseVersionFormat, FIRST_RELEASE, branch.prerelease, FIRSTPRERELEASE);
    } else {
      version = FIRST_RELEASE;
    }

    logger.log(`There is no previous release, the next release version is ${version}`);
  }

  return version;
};

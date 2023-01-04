const semver = require('semver');
const {template} = require('lodash');
const {FIRST_RELEASE, FIRSTPRERELEASE} = require('./definitions/constants');
const {isSameChannel, getLatestVersion, tagsToVersions, highest} = require('./utils');

module.exports = ({
  branch,
  envCi: {commit, build},
  nextRelease: {type, channel},
  lastRelease,
  logger,
  prereleaseBuildFormat,
}) => {
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
  } else {
    version = branch.type === 'prerelease' ? `${FIRST_RELEASE}-${branch.prerelease}.${FIRSTPRERELEASE}` : FIRST_RELEASE;
    logger.log(`There is no previous release`);
  }

  if (branch.type === 'prerelease' && prereleaseBuildFormat) {
    version += `+${template(prereleaseBuildFormat)({build, commit})}`;
  }

  logger.log('The next release version is %s', version);

  return version;
};

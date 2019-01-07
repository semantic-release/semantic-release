const semver = require('semver');
const {FIRST_RELEASE, FIRSTPRERELEASE} = require('./definitions/constants');

module.exports = ({branch, nextRelease: {type, channel}, lastRelease, logger}) => {
  let version;
  if (lastRelease.version) {
    const {major, minor, patch} = semver.parse(lastRelease.version);
    version =
      branch.type === 'prerelease'
        ? semver.prerelease(lastRelease.version) && lastRelease.channel === channel
          ? semver.inc(lastRelease.version, 'prerelease')
          : `${semver.inc(`${major}.${minor}.${patch}`, type)}-${branch.prerelease}.${FIRSTPRERELEASE}`
        : semver.inc(lastRelease.version, type);
    logger.log('The next release version is %s', version);
  } else {
    version = branch.type === 'prerelease' ? `${FIRST_RELEASE}-${branch.prerelease}.${FIRSTPRERELEASE}` : FIRST_RELEASE;
    logger.log(`There is no previous release, the next release version is ${version}`);
  }

  return version;
};

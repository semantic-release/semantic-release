const semver = require('semver');
const {FIRST_RELEASE} = require('./definitions/constants');

module.exports = ({nextRelease: {type}, lastRelease, logger}) => {
  let version;
  if (lastRelease.version) {
    version = semver.inc(lastRelease.version, type);
    logger.log(`The next release version is ${version}`);
  } else {
    version = FIRST_RELEASE;
    logger.log(`There is no previous release, the next release version is ${version}`);
  }

  return version;
};

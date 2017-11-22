const semver = require('semver');
const SemanticReleaseError = require('@semantic-release/error');

module.exports = (type, lastRelease, logger) => {
  let version;
  if (lastRelease.version) {
    version = semver.inc(lastRelease.version, type);
    if (!version) {
      throw new SemanticReleaseError(`Invalid release type ${type}`, 'EINVALIDTYPE');
    }
    logger.log('The next release version is %s', version);
  } else {
    version = '1.0.0';
    logger.log('There is no previous release, the next release version is %s', version);
  }

  return version;
};

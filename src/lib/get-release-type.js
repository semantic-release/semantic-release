const {promisify} = require('util');
const SemanticReleaseError = require('@semantic-release/error');

module.exports = async config => {
  const {plugins, lastRelease} = config;
  const type = await promisify(plugins.analyzeCommits)(config);

  if (!type) {
    throw new SemanticReleaseError('There are no relevant changes, so no new version is released.', 'ENOCHANGE');
  }
  if (!lastRelease.version) return 'initial';

  return type;
};

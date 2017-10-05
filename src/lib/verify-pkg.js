const SemanticReleaseError = require('@semantic-release/error');

module.exports = pkg => {
  if (!pkg.name) {
    throw new SemanticReleaseError('No "name" found in package.json.', 'ENOPKGNAME');
  }

  if (!pkg.repository || !pkg.repository.url) {
    throw new SemanticReleaseError('No "repository" found in package.json.', 'ENOPKGREPO');
  }
};

var SemanticReleaseError = require('@semantic-release/error')

module.exports = function (config) {
  var pkg = config.pkg
  var options = config.options
  var env = config.env
  var errors = []

  if (!pkg.name) {
    errors.push(new SemanticReleaseError(
      'No "name" found in package.json.',
      'ENOPKGNAME'
    ))
  }

  if (!pkg.repository || !pkg.repository.url) {
    errors.push(new SemanticReleaseError(
      'No "repository" found in package.json.',
      'ENOPKGREPO'
    ))
  }

  if (options.debug) return errors

  if (!options.githubToken) {
    errors.push(new SemanticReleaseError(
      'No github token specified.',
      'ENOGHTOKEN'
    ))
  }

  if (!(env.NPM_TOKEN || (env.NPM_OLD_TOKEN && env.NPM_EMAIL))) {
    errors.push(new SemanticReleaseError(
      'No npm token specified.',
      'ENONPMTOKEN'
    ))
  }

  return errors
}

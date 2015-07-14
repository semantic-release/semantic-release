const SemanticReleaseError = require('@semantic-release/error')

module.exports = function (pkg, options, env) {
  let errors = []

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

  if (!options['github-token']) {
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

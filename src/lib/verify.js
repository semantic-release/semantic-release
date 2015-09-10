const SemanticReleaseError = require('@semantic-release/error')

module.exports = function ({pkg, options, env}) {
  const errors = []

  if (!pkg.name) {
    errors.push(new SemanticReleaseError(
      'No "name" found in package.json.',
      'ENOPKGNAME'
    ))
  }

  // only go on if basic validation reports no problems
  if (options.debug) return errors

  if (!(env.NPM_TOKEN || (env.NPM_OLD_TOKEN && env.NPM_EMAIL))) {
    errors.push(new SemanticReleaseError(
      'No npm token specified.',
      'ENONPMTOKEN'
    ))
  }

  return errors
}

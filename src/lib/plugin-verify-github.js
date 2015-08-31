const parseSlug = require('parse-github-repo-url')

const SemanticReleaseError = require('@semantic-release/error')

module.exports = function (config, options, cb) {
  const errors = []
  const pkg = options.pkg

  if (!pkg.repository || !pkg.repository.url) {
    errors.push(new SemanticReleaseError(
      'No "repository" found in package.json.',
      'ENOPKGREPO'
    ))
  } else if (!parseSlug(pkg.repository.url)) {
    errors.push(new SemanticReleaseError(
      'The "repository" field in the package.json is malformed.',
      'EMALFORMEDPKGREPO'
    ))
  }

  if (!options.githubToken) {
    errors.push(new SemanticReleaseError(
      'No github token specified.',
      'ENOGHTOKEN'
    ))
  }

  cb(errors)
}

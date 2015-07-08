const SemanticReleaseError = require('./error')

module.exports = function (plugins, commits, lastRelease, cb) {
  plugins.analyze(commits, (err, type) => {
    if (err) return cb(err)

    if (!type) {
      return cb(new SemanticReleaseError(
        'There are no relevant changes, so no new version is released.',
        'ENOCHANGE'
      ))
    }

    if (!lastRelease.version) return cb(null, 'initial')

    cb(null, type)
  })
}

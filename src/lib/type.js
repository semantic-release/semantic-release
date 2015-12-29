var SemanticReleaseError = require('@semantic-release/error')

module.exports = function (config, cb) {
  var plugins = config.plugins
  var lastRelease = config.lastRelease

  plugins.analyzeCommits(config, function (err, type) {
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

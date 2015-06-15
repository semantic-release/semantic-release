const SemanticReleaseError = require('./error')

module.exports = function (plugins, results, cb) {
  const commits = results.commits
  const lastRelease = results.lastRelease

  const type = plugins.analyze(commits)

  if (!type) {
    return cb(new SemanticReleaseError(
      'There are no relevant changes, so no new version is released',
      'ENOCHANGE'
    ))
  }

  if (!lastRelease.version) return cb(null, 'initial')

  cb(null, type)
}

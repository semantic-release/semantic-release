const SemanticReleaseError = require('@semantic-release/error')
const _ = require('lodash')
const async = require('async')

module.exports = function (config, cb) {
  const { plugins, lastRelease, commits } = config

  async.map(commits, (commit, cb) => {
    plugins.analyzeCommits(_.defaults({ commit }, config), cb)
  },
  (err, types) => {
    if (err) return cb(err)

    if (types[types.length - 1] === 'rskip') {
      return cb(new SemanticReleaseError(
        'The release was skipped',
        'ERSKIP'
      ))
    }

    const typeOrder = ['patch', 'minor', 'major']

    const type = types
                  .map(t => typeOrder.indexOf(t))
                  .reduce((type, t) => (type < t) ? t : type, -1)

    if (type < 0) {
      return cb(new SemanticReleaseError(
        'There are no relevant changes, so no new version is released.',
        'ENOCHANGE'
      ))
    }

    if (!lastRelease.version) return cb(null, 'initial')

    cb(null, typeOrder[type])
  })
}

// TODO: Test, update commit-analyzer
const SemanticReleaseError = require('@semantic-release/error')
const _ = require('lodash')

module.exports = function (config, cb) {
  const { plugins, lastRelease, commits } = config

  parseCommits(plugins.analyzeCommits, config, commits, (err, type) => {
    if (err) return cb(err)

    if (!type) {
      return cb(new SemanticReleaseError(
        'There are no relevant changes, or the release was skipped so no new version is released.',
        'ENOCHANGE'
      ))
    }

    if (!lastRelease.version) return cb(null, 'initial')

    cb(null, type)
  })
}

function parseCommits (parse, config, commits, cb) {
  // 0 is none, 1 is patch, 2 is minor, 3 is major. Then we can do less than.
  const types = ['none', 'patch', 'minor', 'major']
  let type = 0

  function nextCommit (i) {
    parse(_.defaults({ commit: commits[i] }, config), (err, t) => {
      if (err) return cb(err)
      if (typeof t === 'string') t = types.indexOf(t)

      // rskip is not in the array, and therefore will allways be < type (-1).
      if (type < t) type = t

      if (i === 0) {
        let out = types[type]
        if (out === types[0]) out = false
        return cb(null, out)
      }

      setImmediate(() => nextCommit(i - 1))
    })
  }

  nextCommit(commits.length - 1)
}

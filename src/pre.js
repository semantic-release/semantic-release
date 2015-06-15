const auto = require('run-auto')
const semver = require('semver')

const getLastRelease = require('./lib/last-release')
const getCommits = require('./lib/commits')
const getType = require('./lib/type')

module.exports = function (pkg, npmConfig, plugins, cb) {
  auto({
    lastRelease: getLastRelease.bind(null, pkg, npmConfig),
    commits: ['lastRelease', (cb, results) => {
      getCommits(results.lastRelease, cb)
    }],
    type: ['commits', 'lastRelease', (cb, results) => {
      getType(plugins, results.commits, results.lastRelease, cb)
    }]
  }, (err, results) => {
    if (err) return cb(err)

    const nextRelease = {
      type: results.type,
      commits: results.commits,
      lastVersion: results.lastRelease.version,
      version: results.type === 'initial' ?
        '1.0.0' :
        semver.inc(results.lastRelease.version, results.type)
    }

    plugins.verify(nextRelease, (err) => {
      if (err) return cb(err)
      cb(null, nextRelease)
    })
  })
}

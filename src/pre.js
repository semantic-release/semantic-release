const _ = require('lodash')
const auto = require('run-auto')
const semver = require('semver')

const getCommits = require('./lib/commits')
const getType = require('./lib/type')

module.exports = function (config, cb) {
  const { plugins } = config

  auto({
    lastRelease: plugins.getLastRelease.bind(null, config),
    commits: ['lastRelease', (cb, results) => {
      getCommits(_.assign({
        lastRelease: results.lastRelease
      }, config),
      cb)
    }],
    type: ['commits', 'lastRelease', (cb, results) => {
      getType(_.assign({
        commits: results.commits,
        lastRelease: results.lastRelease
      }, config),
      cb)
    }]
  }, (err, results) => {
    if (err) return cb(err)

    const nextRelease = {
      type: results.type,
      version: results.type === 'initial'
        ? '1.0.0'
        : semver.inc(results.lastRelease.version, results.type)
    }

    plugins.verifyRelease(_.assign({
      commits: results.commits,
      lastRelease: results.lastRelease,
      nextRelease
    }, config), (err) => {
      if (err) return cb(err)
      cb(null, nextRelease)
    })
  })
}

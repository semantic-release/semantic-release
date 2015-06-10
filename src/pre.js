'use strict'

var fs = require('fs')

var semver = require('semver')

var getCommits = require('./lib/commits')
var npmInfo = require('./lib/npm-info')
var efh = require('./lib/error').efh

module.exports = function (options, plugins, cb) {
  var path = './package.json'
  var pkg = JSON.parse(fs.readFileSync(path))

  if (!pkg.name) return cb(new Error('Package must have a name'))

  npmInfo(pkg.name, efh(cb)(function (res) {
    getCommits(res.gitHead, efh(cb)(function (commits) {
      var analyzer = require(plugins.analyzer || './lib/analyzer')
      var type = analyzer(commits)

      if (!type) return cb(null, null)

      if (res.version) {
        pkg.version = semver.inc(res.version, type)
      } else {
        type = 'major'
        pkg.version = '1.0.0'
      }

      var writePkg = function () {
        if (!options.debug) fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n')
        cb(null, pkg.version)
      }

      if (!plugins.verification) return writePkg()

      var opts = {}

      if (typeof plugins.verification === 'string') {
        opts.path = plugins.verification
      }
      if (typeof plugins.verification === 'object') {
        opts = plugins.verification
        opts.path = opts.path || opts.name
      }

      opts.type = type
      opts.commits = commits
      opts.version = res.version
      opts.nextVersion = pkg.version

      var verification = require(opts.path)

      console.log('Running verification hook...')

      verification(opts, function (error, ok) {
        if (!error && ok) return writePkg()
        console.log('Verification failed' + (error ? ': ' + error : ''))
        process.exit(1)
      })
    }))
  }))
}

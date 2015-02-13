'use strict'

var fs = require('fs')

var semver = require('semver')

var type = require('../lib/type')
var npmInfo = require('../lib/npm-info')
var efh = require('../lib/error').efh

module.exports = function (options, cb) {
  var path = './package.json'
  var pkg = JSON.parse(fs.readFileSync(path))
  if (!pkg.name) return cb(new Error('Package must have a name'))
  npmInfo(pkg.name, efh(cb)(function (res) {
    type(res.gitHead, efh(cb)(function (type) {
      if (!type) return cb(null, null)
      pkg.version = !res.version ? '1.0.0' : semver.inc(res.version, type)
      if (!options.debug) fs.writeFileSync(path, JSON.stringify(pkg, null, 2))

      cb(null, pkg.version)
    }))
  }))
}

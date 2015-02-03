'use strict'

var fs = require('fs')

var semver = require('semver')

var type = require('../lib/type')
var version = require('../lib/version')
var efh = require('../lib/error').efh

module.exports = function (options, cb) {
  type(efh(cb)(function (type) {
    if (!type) return cb(null, null)

    var path = './package.json'
    var pkg = JSON.parse(fs.readFileSync(path))
    version(pkg, efh(cb)(function (version, unpublished) {
      pkg.version = unpublished ? '1.0.0' : semver.inc(version, type)
      if (!options.debug) fs.writeFileSync(path, JSON.stringify(pkg, null, 2))

      cb(null, pkg.version)
    }))
  }))
}

'use strict'

var fs = require('fs')

var semver = require('semver')

var type = require('../lib/type')
var version = require('../lib/version')

module.exports = function (options, cb) {
  type(function (err, type) {
    if (err) return cb(err)
    if (!type) return cb(null, null)

    var path = './package.json'
    var pkg = JSON.parse(fs.readFileSync(path))
    version(pkg, function (err, version, unpublished) {
      if (err) return cb(err)

      pkg.version = unpublished ? '1.0.0' : semver.inc(version, type)
      if (!options.debug) fs.writeFileSync(path, JSON.stringify(pkg, null, 2))

      cb(null, pkg.version)
    })
  })
}

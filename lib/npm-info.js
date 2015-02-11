'use strict'

var request = require('request')

var efh = require('./error').efh

module.exports = function (pkgName, cb) {
  request(process.env.npm_config_registry + pkgName, efh(cb)(function (response, body) {
    var pkg = JSON.parse(body)

    if (pkg.error && response.statusCode !== 404) return cb(pkg.error)

    var res = {
      version: '',
      gitHead: '',
      pkg: pkg
    }

    if (response.statusCode === 404) return cb(null, res)

    res.version = pkg['dist-tags'].latest
    res.gitHead = pkg.versions[res.version].gitHead

    cb(null, res)
  }))
}

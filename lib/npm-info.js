'use strict'

var request = require('request')

var efh = require('./error').efh

module.exports = function (pkgName, cb) {
  request(process.env.npm_config_registry + pkgName, efh(cb)(function (response, body) {
    var res = {
      version: null,
      gitHead: null,
      pkg: null
    }

    if (response.statusCode === 404 || !body) return cb(null, res)

    var pkg = JSON.parse(body)

    if (pkg.error) return cb(pkg.error)

    res.version = pkg['dist-tags'].latest
    res.gitHead = pkg.versions[res.version].gitHead
    res.pkg = pkg

    cb(null, res)
  }))
}

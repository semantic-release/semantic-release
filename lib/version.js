'use strict'

var request = require('request')

var efh = require('./error').efh

module.exports = function (pkg, cb) {
  if (!pkg.name) return cb(new Error('Package must have a name'))

  request(process.env.npm_config_registry + pkg.name, efh(cb)(function (response, body) {
    var pkg = JSON.parse(body)

    if (response.statusCode === 404 || pkg.error) return cb(null, null, true)

    cb(null, pkg['dist-tags'].latest)
  }))
}

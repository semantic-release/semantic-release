'use strict'

var exec = require('child_process').exec

var efh = require('./error').efh

module.exports = function (pkg, cb) {
  if (!pkg.name) return cb(new Error('Package must have a name'))

  exec('curl -s "' + process.env.npm_config_registry + pkg.name + '"', efh(cb)(function(stdout) {
    var pkg = JSON.parse(stdout)

    if (pkg.error) return cb(null, null, true)

    cb(null, pkg['dist-tags'].latest)
  }))
}

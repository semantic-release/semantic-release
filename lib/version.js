'use strict'

var exec = require('child_process').exec
var unlink = require('fs').unlinkSync

module.exports = function (pkg, cb) {
  if (!pkg.name) return cb(new Error('Package must have a name'))

  exec('npm show ' + pkg.name + ' version', function(err, stdout, stderr) {
    if (err) unlink('./npm-debug.log')

    if (err && /is not in the npm registry/m.test(stderr)) return cb(null, null, true)

    if (err) return cb(err)

    cb(null, stdout.trim())
  })
}

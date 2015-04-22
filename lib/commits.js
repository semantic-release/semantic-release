'use strict'

var exec = require('child_process').exec

var efh = require('./error').efh

module.exports = function (from, cb) {
  var range = (from ? from + '..' : '') + 'HEAD'
  exec(
    'git log -E --format=%H==SPLIT==%s==END== ' + range,
    efh(cb)(function (stdout) {
      cb(null, String(stdout).split('==END==\n')

      .filter(function (raw) {
        return !!raw.trim()
      })

      .map(function (raw) {
        var data = raw.split('==SPLIT==')
        return {
          hash: data[0],
          message: data[1]
        }
      }))
    })
  )
}

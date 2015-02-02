'use strict'

var commits = require('./commits')
var analyze = require('./analyze')

module.exports = function (cb) {
  commits(function (err, commits) {
    if (err) return cb(err)

    cb(null, analyze(commits))
  })
}

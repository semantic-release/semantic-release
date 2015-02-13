'use strict'

var analyze = require('./analyze')
var commits = require('./commits')
var efh = require('../error').efh

module.exports = function (gitHead, cb) {
  commits(gitHead, efh(cb)(function (commits) {
    cb(null, analyze(commits))
  }))
}

'use strict'

var git = require('conventional-changelog/lib/git')

var efh = require('../error').efh

module.exports = function (from, cb) {
  git.getCommits({
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    from: from
  }, efh(cb)(function (commits) {
    cb(null, commits)
  }))
}

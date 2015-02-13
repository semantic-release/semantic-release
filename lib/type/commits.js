'use strict'

var git = require('conventional-changelog/lib/git')

var efh = require('../error').efh

module.exports = function (from, cb) {
  git.getCommits({from: from}, efh(cb)(function (commits) {
    cb(null, commits)
  }))
}

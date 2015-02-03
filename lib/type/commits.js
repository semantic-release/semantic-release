'use strict'

var git = require('conventional-changelog/lib/git')

var efh = require('../error').efh

module.exports = function (cb) {
  git.latestTag(efh(cb)(function (from) {
    git.getCommits({from: from}, efh(cb)(function (commits) {
      cb(null, commits)
    }))
  }))
}

'use strict'

var git = require('conventional-changelog/lib/git')

module.exports = function (cb) {
  git.latestTag(function (err, from) {
    if (err) return cb(err)

    git.getCommits({from: from}, function (err, commits) {
      if (err) return cb(err)
      cb(null, commits)
    })
  })
}

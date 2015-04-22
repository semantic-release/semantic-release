'use strict'

var parseRawCommit = require('conventional-changelog/lib/git').parseRawCommit

module.exports = function (commits) {
  var type = null

  commits

  .map(function (commit) {
    return parseRawCommit(commit.hash + '\n' + commit.message)
  })

  .filter(function (commit) {
    return !!commit
  })

  .every(function (commit) {
    if (commit.breaks.length) {
      type = 'major'
      return false
    }

    if (commit.type === 'feat') type = 'minor'

    if (!type && commit.type === 'fix') type = 'patch'

    return true
  })

  return type
}

'use strict'

module.exports = function (commits) {
  var type = null

  commits.every(function (commit) {
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

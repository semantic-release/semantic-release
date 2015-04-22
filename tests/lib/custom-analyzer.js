'use strict'

module.exports = function (commits) {
  var type = null

  commits.every(function (commit) {
    if (/FOO/.test(commit.message)) {
      type = 'major'
      return false
    }

    if (/BAR/.test(commit.message)) type = 'minor'

    if (!type && /BAZ/.test(commit.message)) type = 'patch'

    return true
  })

  return type
}

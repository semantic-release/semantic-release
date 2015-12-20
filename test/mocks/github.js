module.exports = function () {
  return {
    authenticate: function () {
      return true
    },
    releases: {
      createRelease: function (release, cb) {
        cb(null)
      }
    }
  }
}

module.exports.error = function () {
  return {
    authenticate: function () {
      return true
    },
    releases: {
      createRelease: function (release, cb) {
        cb(new Error('An error with createRelease has occured.'))
      }
    }
  }
}

module.exports = function () {
  return {
    authenticate: function () {
      return true
    },
    repos: {
      createRelease: function (release, cb) {
        cb(null)
      }
    }
  }
}

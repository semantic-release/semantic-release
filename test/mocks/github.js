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

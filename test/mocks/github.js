module.exports = function () {
  return {
    authenticate: function () {
      return true
    },
    gitdata: {
      createReference: function (release, cb) {
        cb(null)
      }
    },
    repos: {
      createRelease: function (release, cb) {
        cb(null)
      }
    }
  }
}

module.exports = function () {
  return {
    authenticate: function () {
      return true
    },
    gitdata: {
      createReference: function (release, cb) {
        cb(null)
      },
      getReference: function (reference, cb) {
        cb(null)
      },
      deleteReference: function (reference, cb) {
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

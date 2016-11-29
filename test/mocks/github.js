module.exports = function () {
  return {
    authenticate: function () {
      return true
    },
    repos: {
      createRelease: function (release, cb) {
        cb(null, {id: 1})
      },
      editRelease: function (release, cb) {
        cb(null)
      }
    }
  }
}

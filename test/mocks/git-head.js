module.exports = function (cb) {
  cb(null, 'bar')
}

module.exports.error = function (cb) {
  cb(new Error('An error with gitHead has occured.'))
}

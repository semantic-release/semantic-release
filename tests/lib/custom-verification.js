'use strict'

module.exports = function (opts, cb) {
  cb(null, !(opts.commits.length % 2))
}

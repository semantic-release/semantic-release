// borrowed from https://github.com/npm/npm/blob/master/lib/config/nerf-dart.js
const url = require('url')

/* istanbul ignore next */
module.exports = function toNerfDart (uri) {
  let parsed = url.parse(uri)
  delete parsed.protocol
  delete parsed.auth
  delete parsed.query
  delete parsed.search
  delete parsed.hash

  return url.resolve(url.format(parsed), '.')
}

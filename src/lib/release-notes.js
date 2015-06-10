'use strict'

var readFile = require('fs').readFileSync

var changelog = require('conventional-changelog')
var parseUrl = require('github-url-from-git')

module.exports = function (cb) {
  var pkg = JSON.parse(readFile('./package.json'))
  var repository = pkg.repository ? parseUrl(pkg.repository.url) : null

  changelog({
    version: pkg.version,
    repository: repository,
    file: false
  }, cb)
}

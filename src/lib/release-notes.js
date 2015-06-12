const { readFileSync } = require('fs')

const changelog = require('conventional-changelog')
const parseUrl = require('github-url-from-git')

module.exports = function (cb) {
  const pkg = JSON.parse(readFileSync('./package.json'))
  const repository = pkg.repository ? parseUrl(pkg.repository.url) : null

  changelog({
    version: pkg.version,
    repository: repository,
    file: false
  }, cb)
}

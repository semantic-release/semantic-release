'use strict'

var exec = require('child_process').exec
var readFile = require('fs').readFileSync

var changelog = require('conventional-changelog')
var GitHubApi = require('github')
var parseSlug = require('parse-github-repo-url')
var parseUrl = require('github-url-from-git')

var efh = require('../lib/error').efh

var github = new GitHubApi({
  version: '3.0.0',
  protocol: process.env.GHRS_PROTO || 'https',
  host: process.env.GHRS_HOST || 'api.github.com',
  port: process.env.GHRS_PORT || 443
})

module.exports = function (options, cb) {
  var pkg = JSON.parse(readFile('./package.json'))
  var repository = pkg.repository ? pkg.repository.url : null

  if (!repository) return cb(new Error('Package must have a repository'))

  changelog({
    version: pkg.version,
    repository: parseUrl(repository),
    file: false
  }, efh(cb)(function (log) {
    exec('git rev-parse HEAD', efh(cb)(function (hash) {
      var ghRepo = parseSlug(repository)
      var release = {
        owner: ghRepo[0],
        repo: ghRepo[1],
        tag_name: 'v' + pkg.version,
        target_commitish: hash,
        draft: options.debug,
        body: log
      }

      github.authenticate({
        type: 'oauth',
        token: options.token
      })

      github.releases.createRelease(release, efh(cb)(function () {
        cb(null, true)
      }))
    }))
  }))
}

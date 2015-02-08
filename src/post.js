'use strict'

var readFile = require('fs').readFileSync
var url = require('url')

var changelog = require('conventional-changelog')
var gitHead = require('git-head')
var GitHubApi = require('github')
var parseSlug = require('parse-github-repo-url')
var parseUrl = require('github-url-from-git')

var efh = require('../lib/error').efh

module.exports = function (options, cb) {
  var pkg = JSON.parse(readFile('./package.json'))
  var repository = pkg.repository ? pkg.repository.url : null

  if (!repository) return cb(new Error('Package must have a repository'))

  var config = options['github-url'] ? url.parse(options['github-url']) : {}

  var github = new GitHubApi({
    version: '3.0.0',
    port: config.port,
    protocol: (config.protocol || '').split(':')[0] || null,
    host: config.hostname
  })

  changelog({
    version: pkg.version,
    repository: parseUrl(repository),
    file: false
  }, efh(cb)(function (log) {
    gitHead(efh(cb)(function (hash) {
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

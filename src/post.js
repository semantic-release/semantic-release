'use strict'

var readFile = require('fs').readFileSync
var url = require('url')

var gitHead = require('git-head')
var GitHubApi = require('github')
var parseSlug = require('parse-github-repo-url')

var efh = require('./lib/error').efh

module.exports = function (options, plugins, cb) {
  var pkg = JSON.parse(readFile('./package.json'))
  var repository = pkg.repository ? pkg.repository.url : null

  if (!repository) return cb(new Error('Package must have a repository'))

  var notesGenerator = require(plugins.notes || './lib/release-notes')

  var config = options['github-url'] ? url.parse(options['github-url']) : {}

  var github = new GitHubApi({
    version: '3.0.0',
    port: config.port,
    protocol: (config.protocol || '').split(':')[0] || null,
    host: config.hostname
  })

  notesGenerator(efh(cb)(function (log) {
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

'use strict'

var exec = require('child_process').exec
var readFile = require('fs').readFileSync

var changelog = require('conventional-changelog')
var GitHubApi = require('github')
var parseSlug = require('parse-github-repo-url')
var parseUrl = require('github-url-from-git')

var github = new GitHubApi({
  version: '3.0.0'
})

module.exports = function (options, cb) {
  var pkg = JSON.parse(readFile('./package.json'))
  var repository = pkg.repository ? pkg.repository.url : null

  if (!repository) return cb('Package must have a repository')

  changelog({
    version: pkg.version,
    repository: parseUrl(repository),
    file: false
  }, function(err, log) {
    if (err) return cb(err)

    exec('git rev-parse HEAD', function(err, hash) {
      if (err) return cb(err)

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

      github.releases.createRelease(release, function(err) {
        if (err) return cb(err)
        cb(null, true)
      })
    })
  })
}

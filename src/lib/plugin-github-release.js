var url = require('url')

var gitHead = require('git-head')
var GitHubApi = require('github')
var parseSlug = require('parse-github-repo-url')

module.exports = githubRelease

function githubRelease (pluginConfig, config, callback) {
  var githubConfig = config.options.githubUrl ? url.parse(config.options.githubUrl) : {}

  var github = new GitHubApi({
    version: '3.0.0',
    port: githubConfig.port,
    protocol: (githubConfig.protocol || '').split(':')[0] || null,
    host: githubConfig.hostname
  })

  config.plugins.generateNotes(config, function (err, log) {
    if (err) {
      return callback(err)
    }

    gitHead(function (err, hash) {
      if (err) {
        return callback(err)
      }

      var githubRepo = parseSlug(config.pkg.repository.url)
      var release = {
        owner: githubRepo[0],
        repo: githubRepo[1],
        name: 'v' + config.pkg.version,
        tag_name: 'v' + config.pkg.version,
        target_commitish: hash,
        draft: !!config.options.debug,
        body: log
      }

      if (config.options.debug) {
        return callback(null, release)
      }

      github.authenticate({
        type: 'oauth',
        token: config.options.githubToken
      })

      github.releases.createRelease(release, function (err) {
        if (err) {
          return callback(err)
        }

        callback(null, release)
      })
    })
  })
}

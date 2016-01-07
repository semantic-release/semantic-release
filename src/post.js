var url = require('url')

var gitHead = require('git-head')
var GitHubApi = require('github')
var parseSlug = require('@bahmutov/parse-github-repo-url')

module.exports = function (config, cb) {
  var pkg = config.pkg
  var options = config.options
  var plugins = config.plugins
  var ghConfig = options.githubUrl ? url.parse(options.githubUrl) : {}

  var github = new GitHubApi({
    version: '3.0.0',
    port: ghConfig.port,
    protocol: (ghConfig.protocol || '').split(':')[0] || null,
    host: ghConfig.hostname
  })

  plugins.generateNotes(config, function (err, log) {
    if (err) return cb(err)

    gitHead(function (err, hash) {
      if (err) return cb(err)

      var ghRepo = parseSlug(pkg.repository.url)
      var release = {
        owner: ghRepo[0],
        repo: ghRepo[1],
        name: 'v' + pkg.version,
        tag_name: 'v' + pkg.version,
        target_commitish: hash,
        draft: !!options.debug,
        body: log
      }

      if (options.debug && !options.githubToken) {
        return cb(null, false, release)
      }

      github.authenticate({
        type: 'oauth',
        token: options.githubToken
      })

      github.releases.createRelease(release, function (err) {
        if (err) return cb(err)

        cb(null, true, release)
      })
    })
  })
}

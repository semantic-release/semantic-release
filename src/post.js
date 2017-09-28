var url = require('url')

var gitHead = require('git-head')
var GitHubApi = require('github')
var parseSlug = require('parse-github-repo-url')

module.exports = function (config, cb) {
  var pkg = config.pkg
  var options = config.options
  var plugins = config.plugins
  var ghConfig = options.githubUrl ? url.parse(options.githubUrl) : {}

  var github = new GitHubApi({
    port: ghConfig.port,
    protocol: (ghConfig.protocol || '').split(':')[0] || null,
    host: ghConfig.hostname,
    pathPrefix: options.githubApiPathPrefix || null
  })

  plugins.generateNotes(config, function (err, log) {
    if (err) return cb(err)

    gitHead(function (err, hash) {
      if (err) return cb(err)

      var ghRepo = parseSlug(pkg.repository.url)
      var versionName = 'v' + pkg.version
      var customTagName = (pkg.publishConfig || {}).tag

      var refPart = 'tags'

      var versionTag = {
        owner: ghRepo[0],
        repo: ghRepo[1],
        ref: 'refs/' + refPart + '/' + versionName,
        sha: hash
      }

      var customTag = customTagName ? {
        owner: ghRepo[0],
        repo: ghRepo[1],
        ref: 'refs/' + refPart + '/' + customTagName,
        sha: hash
      } : null

      var release = {
        owner: ghRepo[0],
        repo: ghRepo[1],
        tag_name: versionName,
        name: versionName,
        target_commitish: options.branch,
        draft: !!options.debug,
        body: log
      }

      if (options.debug && !options.githubToken) {
        return cb(null, false, release)
      }

      github.authenticate({
        type: 'token',
        token: options.githubToken
      })

      if (options.debug) {
        return github.repos.createRelease(release, function (err) {
          if (err) return cb(err)

          cb(null, true, release)
        })
      }

      github.gitdata.createReference(versionTag, function (err) {
        if (err) return cb(err)

        // create reference based on the custom tag
        var customReference = {
          owner: ghRepo[0],
          repo: ghRepo[1],
          ref: refPart + '/' + customTagName
        }

        // try to retrive it
        github.gitdata.getReference(customReference, function (err, ref) {
          // if it doesn't exist,
          if (err) {
            // try to create it
            github.gitdata.createReference(customTag, function (err) {
              if (err) return cb(err)
            })
          } else if (ref) {
            // if reference exists, try to delete it
            github.gitdata.deleteReference(customReference, function (err, msg) {
              if (err) return cb(err)
              else if (msg) {
                // if delete was successful, try to create again
                github.gitdata.createReference(customTag, function (err) {
                  if (err) return cb(err)
                })
              }
            })
          }
        })

        github.repos.createRelease(release, function (err) {
          if (err) return cb(err)

          cb(null, true, release)
        })
      })
    })
  })
}

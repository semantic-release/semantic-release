const url = require('url')

const gitHead = require('git-head')
const GitHubApi = require('github')
const parseSlug = require('parse-github-repo-url')

module.exports = function (config, cb) {
  const { pkg, options, plugins } = config
  const ghConfig = options.githubUrl ? url.parse(options.githubUrl) : {}

  const github = new GitHubApi({
    version: '3.0.0',
    port: ghConfig.port,
    protocol: (ghConfig.protocol || '').split(':')[0] || null,
    host: ghConfig.hostname
  })

  plugins.generateNotes(config, (err, log) => {
    if (err) return cb(err)

    gitHead((err, hash) => {
      if (err) return cb(err)

      const ghRepo = parseSlug(pkg.repository.url)
      const release = {
        owner: ghRepo[0],
        repo: ghRepo[1],
        name: `v${pkg.version}`,
        tag_name: `v${pkg.version}`,
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

      github.releases.createRelease(release, (err) => {
        if (err) return cb(err)

        cb(null, true, release)
      })
    })
  })
}

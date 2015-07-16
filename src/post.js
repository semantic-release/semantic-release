const url = require('url')

const gitHead = require('git-head')
const GitHubApi = require('github')
const parseSlug = require('parse-github-repo-url')

module.exports = function (pkg, argv, plugins, cb) {
  const config = argv['github-url'] ? url.parse(argv['github-url']) : {}

  const github = new GitHubApi({
    version: '3.0.0',
    port: config.port,
    protocol: (config.protocol || '').split(':')[0] || null,
    host: config.hostname
  })

  plugins.generateNotes(pkg, (err, log) => {
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
        draft: !!argv.debug,
        body: log
      }

      if (argv.debug && !argv['github-token']) {
        return cb(null, false, release)
      }

      github.authenticate({
        type: 'oauth',
        token: argv['github-token']
      })

      github.releases.createRelease(release, (err) => {
        if (err) return cb(err)

        cb(null, true, release)
      })
    })
  })
}

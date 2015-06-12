const fs = require('fs')

const semver = require('semver')

const getCommits = require('./lib/commits')
const npmInfo = require('./lib/npm-info')
const { efh } = require('./lib/error')

module.exports = function (options, plugins, cb) {
  const path = './package.json'
  let pkg = JSON.parse(fs.readFileSync(path))

  if (!pkg.name) return cb(new Error('Package must have a name'))

  npmInfo(pkg.name, efh(cb)((res) => {
    getCommits(res.gitHead, efh(cb)((commits) => {
      const analyzer = require(plugins.analyzer || './lib/analyzer')
      let type = analyzer(commits)

      if (!type) return cb(null, null)

      if (res.version) {
        pkg.version = semver.inc(res.version, type)
      } else {
        type = 'major'
        pkg.version = '1.0.0'
      }

      function writePkg () {
        if (!options.debug) fs.writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`)
        cb(null, pkg.version)
      }

      if (!plugins.verification) return writePkg()

      let opts = {}

      if (typeof plugins.verification === 'string') {
        opts.path = plugins.verification
      }
      if (typeof plugins.verification === 'object') {
        opts = plugins.verification
        opts.path = opts.path || opts.name
      }

      opts.type = type
      opts.commits = commits
      opts.version = res.version
      opts.nextVersion = pkg.version

      const verification = require(opts.path)

      console.log('Running verification hook...')

      verification(opts, (error, ok) => {
        if (!error && ok) return writePkg()
        console.log('Verification failed' + (error ? ': ' + error : ''))
        process.exit(1)
      })
    }))
  }))
}

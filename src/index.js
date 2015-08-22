const { readFileSync, writeFileSync } = require('fs')
const path = require('path')
const url = require('url')

const _ = require('lodash')
const log = require('npmlog')
const nopt = require('nopt')
const npmconf = require('npmconf')

log.heading = 'semantic-release'
const env = process.env
const pkg = JSON.parse(readFileSync('./package.json'))
const knownOptions = {
  branch: String,
  debug: Boolean,
  'github-token': String,
  'github-url': String,
  'analyze-commits': [path, String],
  'generate-notes': [path, String],
  'verify-conditions': [path, String],
  'verify-release': [path, String]
}
const options = _.defaults(
  _.mapKeys(nopt(knownOptions), (value, key) => _.camelCase(key)),
  pkg.release,
  {
    branch: 'master',
    fallbackTags: {
      next: 'latest'
    },
    debug: !env.CI,
    githubToken: env.GH_TOKEN || env.GITHUB_TOKEN,
    githubUrl: env.GH_URL
  }
)
const plugins = require('./lib/plugins')(options)

npmconf.load({}, (err, conf) => {
  if (err) {
    log.error('init', 'Failed to load npm config.', err)
    process.exit(1)
  }

  let npm = {
    auth: {
      token: env.NPM_TOKEN
    },
    loglevel: conf.get('loglevel'),
    registry: require('./lib/get-registry')(pkg, conf),
    tag: (pkg.publishConfig || {}).tag || conf.get('tag') || 'latest'
  }

  // normalize trailing slash
  npm.registry = url.format(url.parse(npm.registry))

  log.level = npm.loglevel

  const config = {env, pkg, options, plugins, npm}

  let hide = {}
  if (options.githubToken) hide.githubToken = '***'

  log.verbose('init', 'options:', _.assign({}, options, hide))
  log.verbose('init', 'Verifying config.')

  const errors = require('./lib/verify')(config)
  errors.forEach((err) => log.error('init', `${err.message} ${err.code}`))
  if (errors.length) process.exit(1)

  if (options.argv.remain[0] === 'pre') {
    log.verbose('pre', 'Running pre-script.')
    log.verbose('pre', 'Veriying conditions.')

    plugins.verifyConditions(config, (err) => {
      if (err) {
        log[options.debug ? 'warn' : 'error']('pre', err.message)
        if (!options.debug) process.exit(1)
      }

      const nerfDart = require('nerf-dart')(npm.registry)
      let wroteNpmRc = false

      if (env.NPM_TOKEN) {
        conf.set(`${nerfDart}:_authToken`, '${NPM_TOKEN}', 'project')
        wroteNpmRc = true
      } else if (env.NPM_OLD_TOKEN && env.NPM_EMAIL) {
        // Using the old auth token format is not considered part of the public API
        // This might go away anytime (i.e. once we have a better testing strategy)
        conf.set('_auth', '${NPM_OLD_TOKEN}', 'project')
        conf.set('email', '${NPM_EMAIL}', 'project')
        wroteNpmRc = true
      }

      conf.save('project', (err) => {
        if (err) return log.error('pre', 'Failed to save npm config.', err)

        if (wroteNpmRc) log.verbose('pre', 'Wrote authToken to .npmrc.')

        require('./pre')(config, (err, release) => {
          if (err) {
            log.error('pre', 'Failed to determine new version.')

            const args = ['pre', (err.code ? `${err.code} ` : '') + err.message]
            if (err.stack) args.push(err.stack)
            log.error(...args)
            process.exit(1)
          }

          const message = `Determined version ${release.version} as "${npm.tag}".`

          log.verbose('pre', message)

          if (options.debug) {
            log.error('pre', `${message} Not publishing in debug mode.`, release)
            process.exit(1)
          }

          writeFileSync('./package.json', JSON.stringify(_.assign(pkg, {
            version: release.version
          }), null, 2))

          log.verbose('pre', `Wrote version ${release.version} to package.json.`)
        })
      })
    })
  } else if (options.argv.remain[0] === 'post') {
    log.verbose('post', 'Running post-script.')

    require('./post')(config, (err, published, release) => {
      if (err) {
        log.error('post', 'Failed to publish release notes.', err)
        process.exit(1)
      }

      log.verbose('post', `${published ? 'Published' : 'Generated'} release notes.`, release)
    })
  } else {
    log.error('post', `Command "${options.argv.remain[0]}" not recognized. User either "pre" or "post"`)
  }
})

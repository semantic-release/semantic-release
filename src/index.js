const { readFileSync, writeFileSync } = require('fs')
const path = require('path')

const _ = require('lodash')
const log = require('npmlog')
const nopt = require('nopt')
const npmconf = require('npmconf')

const PREFIX = 'semantic-release'
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
    debug: !env.CI,
    githubToken: env.GH_TOKEN || env.GITHUB_TOKEN,
    githubUrl: env.GH_URL
  }
)
const plugins = require('./lib/plugins')(options)

npmconf.load({}, (err, conf) => {
  if (err) {
    log.error(PREFIX, 'Failed to load npm config.', err)
    process.exit(1)
  }

  let npm = {
    auth: {
      token: env.NPM_TOKEN
    },
    loglevel: conf.get('loglevel'),
    registry: conf.get('registry'),
    tag: (pkg.publishConfig || {}).tag || conf.get('tag') || 'latest'
  }

  if (npm.registry[npm.registry.length - 1] !== '/') npm.registry += '/'

  log.level = npm.loglevel

  const config = {PREFIX, log, env, pkg, options, plugins, npm}

  log.verbose(PREFIX, 'options:', _.assign({
    githubToken: options.githubToken ? '***' : undefined
  }), options)
  log.verbose(PREFIX, 'Verifying config.')

  const errors = require('./lib/verify')(config)
  errors.forEach((err) => log.error(PREFIX, `${err.message} ${err.code}`))
  if (errors.length) process.exit(1)

  if (options.argv.remain[0] === 'pre') {
    log.verbose(PREFIX, 'Running pre-script.')
    log.verbose(PREFIX, 'Veriying conditions.')

    plugins.verifyConditions(config, (err) => {
      if (err) {
        log[options.debug ? 'warn' : 'error'](PREFIX, err.message)
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
        if (err) return log.error(PREFIX, 'Failed to save npm config.', err)

        if (wroteNpmRc) log.verbose(PREFIX, 'Wrote authToken to .npmrc.')

        require('./pre')(config, (err, release) => {
          if (err) {
            log.error(PREFIX, 'Failed to determine new version.')

            const args = [PREFIX, (err.code ? `${err.code} ` : '') + err.message]
            if (err.stack) args.push(err.stack)
            log.error(...args)
            process.exit(1)
          }

          const message = `Determined version ${release.version} as "${npm.tag}".`

          log.verbose(PREFIX, message)

          if (options.debug) {
            log.error(PREFIX, `${message} Not publishing in debug mode.`, release)
            process.exit(1)
          }

          writeFileSync('./package.json', JSON.stringify(_.assign(pkg, {
            version: release.version
          }), null, 2))

          log.verbose(PREFIX, `Wrote version ${release.version} to package.json.`)
        })
      })
    })
  } else if (options.argv.remain[0] === 'post') {
    log.verbose(PREFIX, 'Running post-script.')

    require('./post')(config, (err, published, release) => {
      if (err) {
        log.error(PREFIX, 'Failed to publish release notes.', err)
        process.exit(1)
      }

      log.verbose(PREFIX, `${published ? 'Published' : 'Generated'} release notes.`, release)
    })
  } else {
    log.error(PREFIX, `Command "${options.argv.remain[0]}" not recognized. User either "pre" or "post"`)
  }
})

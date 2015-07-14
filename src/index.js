const { readFileSync, writeFileSync } = require('fs')

const _ = require('lodash')
const log = require('npmlog')
const nopt = require('nopt')
const npmconf = require('npmconf')

const env = process.env
const options = _.defaults(nopt({
  debug: Boolean,
  'github-token': String,
  'github-url': String
}, {
  token: 'github-token',
  dry: 'debug'
}), {
  debug: !env.CI,
  'github-token': env.GH_TOKEN || env.GITHUB_TOKEN,
  'github-url': env.GH_URL
})
const PREFIX = 'semantic-release'

const pkg = JSON.parse(readFileSync('./package.json'))
const plugins = require('./lib/plugins')(pkg.release || {})

npmconf.load({}, (err, conf) => {
  if (err) {
    log.error(PREFIX, 'Failed to load npm config.', err)
    process.exit(1)
  }

  log.level = conf.get('loglevel')

  log.verbose(PREFIX, 'argv:', options)
  log.verbose(PREFIX, 'options:', pkg.release || 'no options')
  log.verbose(PREFIX, 'Verifying pkg, options and env.')

  const errors = require('./lib/verify')(pkg, options, env)
  errors.forEach((err) => log.error(PREFIX, `${err.message} ${err.code}`))
  if (errors.length) process.exit(1)

  if (!options.argv.cooked.length || options.argv.cooked[0] === 'pre') {
    log.verbose(PREFIX, 'Running pre-script.')
    log.verbose(PREFIX, 'Veriying conditions.')

    plugins.verifyConditions(pkg, options, env, (err) => {
      if (err) {
        log[options.debug ? 'warn' : 'error'](PREFIX, err.message)
        if (!options.debug) process.exit(1)
      }

      const registry = conf.get('registry')
      const nerfDart = require('./lib/nerf-dart')(registry)
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

        require('./pre')(pkg, {
          auth: {
            token: env.NPM_TOKEN
          },
          loglevel: log.level,
          registry: registry + (registry[registry.length - 1] !== '/' ? '/' : '')
        },
        plugins,
        (err, release) => {
          if (err) {
            log.error(PREFIX, 'Failed to determine new version.')

            const args = [PREFIX, (err.code ? `${err.code} ` : '') + err.message]
            if (err.stack) args.push(err.stack)
            log.error(...args)
            process.exit(1)
          }

          log.verbose(PREFIX, `Determined version ${release.version}.`)

          if (options.debug) {
            log.error(PREFIX, `Determined version ${release.version}, but not publishing in debug mode.`, release)
            process.exit(1)
          }

          writeFileSync('./package.json', JSON.stringify(_.assign(pkg, {
            version: release.version
          }), null, 2))

          log.verbose(PREFIX, `Wrote version ${release.version} to package.json.`)
        })
      })
    })
  } else if (options.argv.cooked[0] === 'post') {
    log.verbose(PREFIX, 'Running post-script.')

  } else {
    log.error(PREFIX, `Command "${options.argv.cooked[0]}" not recognized. User either "pre" or "post"`)
  }
})

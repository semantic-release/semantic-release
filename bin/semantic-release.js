#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var url = require('url')

var _ = require('lodash')
var log = require('npmlog')
var nopt = require('nopt')
var npm = require('npm')
var normalizeData = require('normalize-package-data')

log.heading = 'semantic-release'
var env = process.env
var pkg = JSON.parse(fs.readFileSync('./package.json'))
normalizeData(pkg)
var knownOptions = {
  branch: String,
  debug: Boolean,
  'github-token': String,
  'github-url': String,
  'analyze-commits': [path, String],
  'generate-notes': [path, String],
  'verify-conditions': [path, String],
  'verify-release': [path, String]
}
var options = _.defaults(
  _.mapKeys(nopt(knownOptions), function (value, key) {
    return _.camelCase(key)
  }),
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
var plugins = require('../src/lib/plugins')(options)

npm.load(function (err, npm) {
  if (err) {
    log.error('init', 'Failed to load npm config.', err)
    process.exit(1)
  }

  var npmConf = {
    auth: {
      token: env.NPM_TOKEN
    },
    loglevel: npm.config.get('loglevel'),
    registry: require('../src/lib/get-registry')(pkg, npm.config),
    tag: (pkg.publishConfig || {}).tag || npm.config.get('tag') || 'latest'
  }

  // normalize trailing slash
  npmConf.registry = url.format(url.parse(npmConf.registry))

  log.level = npmConf.loglevel

  var config = {
    env: env,
    pkg: pkg,
    options: options,
    plugins: plugins,
    npm: npmConf
  }

  var hide = {}
  if (options.githubToken) hide.githubToken = '***'

  log.verbose('init', 'options:', _.assign({}, options, hide))
  log.verbose('init', 'Verifying config.')

  var errors = require('../src/lib/verify')(config)
  errors.forEach(function (err) {
    log.error('init', err.message + ' ' + err.code)
  })
  if (errors.length) process.exit(1)

  if (options.argv.remain[0] === 'pre') {
    log.verbose('pre', 'Running pre-script.')
    log.verbose('pre', 'Veriying conditions.')

    plugins.verifyConditions(config, function (err) {
      if (err) {
        log[options.debug ? 'warn' : 'error']('pre', err.message)
        if (!options.debug) process.exit(1)
      }

      var nerfDart = require('nerf-dart')(npmConf.registry)
      var wroteNpmRc = false

      if (env.NPM_OLD_TOKEN && env.NPM_EMAIL) {
        // Using the old auth token format is not considered part of the public API
        // This might go away anytime (i.e. once we have a better testing strategy)
        npm.set('_auth', '${NPM_OLD_TOKEN}', 'project')
        npm.set('email', '${NPM_EMAIL}', 'project')
        wroteNpmRc = true
      } else if (env.NPM_TOKEN) {
        npm.set(nerfDart + ':_authToken', '${NPM_TOKEN}', 'project')
        wroteNpmRc = true
      }

      if (wroteNpmRc) log.verbose('pre', 'Wrote authToken to .npmrc.')

      require('../src/pre')(config, function (err, release) {
        if (err) {
          log.error('pre', 'Failed to determine new version.')

          var args = ['pre', (err.code ? err.code + ' ' : '') + err.message]
          if (err.stack) args.push(err.stack)
          log.error.apply(log, args)
          process.exit(1)
        }

        var message = 'Determined version ' + release.version + ' as "' + npmConf.tag + '".'

        log.verbose('pre', message)

        if (options.debug) {
          log.error('pre', message + ' Not publishing in debug mode.', release)
          process.exit(1)
        }

        try {
          var shrinkwrap = JSON.parse(fs.readFileSync('./npm-shrinkwrap.json'))
          shrinkwrap.version = release.version
          fs.writeFileSync('./npm-shrinkwrap.json', JSON.stringify(shrinkwrap, null, 2))
          log.verbose('pre', 'Wrote version ' + release.version + 'to npm-shrinkwrap.json.')
        } catch (e) {
          log.silly('pre', 'Couldn\'t find npm-shrinkwrap.json.')
        }

        fs.writeFileSync('./package.json', JSON.stringify(_.assign(pkg, {
          version: release.version
        }), null, 2))

        log.verbose('pre', 'Wrote version ' + release.version + ' to package.json.')
      })
    })
  } else if (options.argv.remain[0] === 'post') {
    log.verbose('post', 'Running post-script.')

    require('../src/post')(config, function (err, published, release) {
      if (err) {
        log.error('post', 'Failed to publish release notes.', err)
        process.exit(1)
      }

      log.verbose('post', (published ? 'Published' : 'Generated') + ' release notes.', release)
    })
  } else {
    log.error('post', 'Command "' + options.argv.remain[0] + '" not recognized. User either "pre" or "post"')
  }
})

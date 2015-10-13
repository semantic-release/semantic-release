const path = require('path')
const url = require('url')
const { readFileSync } = require('fs')

const _ = require('lodash')
const nopt = require('nopt')
const npmconf = require('npmconf')

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
const plugins = require('./plugins')(options)

module.exports = (cb) => {
  npmconf.load({}, (err, conf) => {
    if (err) return cb(err)

    let npm = {
      auth: {
        token: env.NPM_TOKEN
      },
      loglevel: conf.get('loglevel'),
      registry: require('./get-registry')(pkg, conf),
      tag: (pkg.publishConfig || {}).tag || conf.get('tag') || 'latest'
    }

    // normalize trailing slash
    npm.registry = url.format(url.parse(npm.registry))

    const config = {env, pkg, options, plugins, npm}

    return cb(null, { config, conf, options })
  })
}


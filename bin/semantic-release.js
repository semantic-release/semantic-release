#!/usr/bin/env node
var run = require('../src/run.js')
var readPkg = require('../src/lib/read-pkg.js')
var path = require('path')

var _ = require('lodash')
var log = require('npmlog')
var nopt = require('nopt')
var npmconf = require('npmconf')

log.heading = 'semantic-release'
var env = process.env
var pkg = readPkg('./package.json')
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

npmconf.load({}, function (err, conf) {
  run(err, conf, options, plugins, pkg)
})

exports.run = run

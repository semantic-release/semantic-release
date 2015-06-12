#!/usr/bin/env node

var readFile = require('fs').readFileSync

var minimist = require('minimist')

var argv = minimist(process.argv.slice(2), {
  alias: {
    d: 'debug',
    dry: 'debug',
    t: 'token',
    g: 'github-url'
  },
  booleans: ['debug'],
  default: {
    debug: !process.env.CI,
    token: process.env.GH_TOKEN || process.env.TOKEN || process.env.GITHUB_TOKEN,
    'github-url': process.env.GH_URL
  }
})

var npmArgv = process.env.npm_config_argv ?
  minimist(JSON.parse(process.env.npm_config_argv).cooked) :
  {_: []}

var plugins = JSON.parse(readFile('./package.json')).release || {}

var main

/* istanbul ignore next */
try {
  main = require('../dist/main')
} catch (e) {
  require('babel/register')
  main = require('../src/main')
}

if (~argv._.indexOf('pre')) {
  main.pre(argv, npmArgv, plugins)
} else if (~argv._.indexOf('post')) {
  main.post(argv, npmArgv, plugins)
} else if (~argv._.indexOf('setup')) {
  main.setup(argv, npmArgv, plugins)
}

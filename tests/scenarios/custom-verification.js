'use strict'

var path = require('path')

var efh = require('error-first-handler')
var nixt = require('nixt')
var test = require('tap').test

var createModule = require('../lib/create-module')

test('custom-verification', function (t) {
  createModule({
    release: {
      verification: path.join(__dirname, '../lib/custom-verification')
    }
  }, efh()(function (name, cwd) {
    t.test('even commit count', function (t) {
      t.plan(1)
      nixt()
        .cwd(cwd)
        .env('CI', true)
        .env('npm_config_registry', 'http://127.0.0.1:4873/')
        .exec('git commit --allow-empty -m "feat: commit"')
        .run('npm run prepublish')
        .code(0)
        .end(function (err) {
          t.error(err, 'nixt')
        })
    })

    t.test('odd commit count', function (t) {
      t.plan(1)
      nixt()
        .cwd(cwd)
        .env('CI', true)
        .env('npm_config_registry', 'http://127.0.0.1:4873/')
        .exec('git commit --allow-empty -m "feat: commit"')
        .run('npm run prepublish')
        .code(1)
        .stdout(/Verification failed/)
        .end(function (err) {
          t.error(err, 'nixt')
        })
    })
  }))
})

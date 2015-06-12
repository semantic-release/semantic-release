'use strict'

var test = require('tap').test
var nock = require('nock')

var npmInfo = require('../../dist/lib/npm-info.js')

var registry = 'http://registry.npmjs.org/'

var defaultModule = {
  'dist-tags': {
    latest: '1.0.0'
  },
  versions: {
    '1.0.0': {
      gitHead: 'HEAD'
    }
  }
}

process.env.npm_config_registry = registry

test('npm-info', function (t) {
  var regMock = nock(registry, {
    reqheaders: {
      'authorization': 'Bearer testtoken'
    }
  })
  .get('/express')
  .reply(200, defaultModule)
  .get('/@user%2Fmodule')
  .reply(200, defaultModule)

  t.test('get unscoped module', function (t) {
    t.plan(3)
    npmInfo('express', function (err, info) {
      t.error(err, 'error')
      t.is(info.version, '1.0.0', 'version')
      t.is(info.gitHead, 'HEAD', 'gitHead')
    })
  })
  t.test('get scoped module', function (t) {
    t.plan(3)
    npmInfo('@user/module', function (err, info) {
      t.error(err, 'error')
      t.is(info.version, '1.0.0', 'version')
      t.is(info.gitHead, 'HEAD', 'gitHead')
      regMock.done()
    })
  })
})

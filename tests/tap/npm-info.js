const test = require('tap').test
const nock = require('nock')

const npmInfo = require('../../dist/lib/npm-info.js')

const registry = 'http://registry.npmjs.org/'

const defaultModule = {
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

test('npm-info', (t) => {
  const regMock = nock(registry, {
    reqheaders: {
      'authorization': 'Bearer testtoken'
    }
  })
  .get('/express')
  .reply(200, defaultModule)
  .get('/@user%2Fmodule')
  .reply(200, defaultModule)

  t.test('get unscoped module', (t) => {
    t.plan(3)
    npmInfo('express', (err, info) => {
      t.error(err, 'error')
      t.is(info.version, '1.0.0', 'version')
      t.is(info.gitHead, 'HEAD', 'gitHead')
    })
  })
  t.test('get scoped module', (t) => {
    t.plan(3)
    npmInfo('@user/module', (err, info) => {
      t.error(err, 'error')
      t.is(info.version, '1.0.0', 'version')
      t.is(info.gitHead, 'HEAD', 'gitHead')
      regMock.done()
    })
  })
})

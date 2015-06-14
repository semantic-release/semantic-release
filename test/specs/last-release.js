const test = require('tap').test
const nock = require('nock')

const lastRelease = require('../../dist/lib/last-release.js')

const availableModule = {
  'dist-tags': {
    latest: '1.33.7'
  },
  versions: {
    '1.33.7': {
      gitHead: 'HEAD'
    }
  }
}

const registry = 'http://registry.npmjs.org'
const regMock = nock(registry)
  .get('/available')
  .reply(200, availableModule)
  .get('/@scoped/available')
  .reply(200, availableModule)
  .get('/unavailable')
  .reply(404, {})

test('last release from registry', (t) => {
  t.test('get release from package name', (t) => {
    lastRelease({
      name: 'available'
    }, {
      registry
    }, (err, release) => {
      t.error(err)
      t.is(release.version, '1.33.7', 'version')
      t.is(release.gitHead, 'HEAD', 'gitHead')
    })
  })

  t.test('get release from scoped package name', (t) => {
    lastRelease({
      name: '@scoped/available'
    }, {
      registry
    }, (err, release) => {
      t.error(err)
      t.is(release.version, '1.33.7', 'version')
      t.is(release.gitHead, 'HEAD', 'gitHead')
    })
  })

  t.test('get nothing from not yet published package name', (t) => {
    lastRelease({
      name: 'unavailable'
    }, {
      registry
    }, (err, release) => {
      t.error(err)
      t.is(release.version, undefined, 'no version')
      regMock.done()
    })
  })
})

const test = require('tap').test

require('../mocks/registry')
const lastRelease = require('../../dist/lib/last-release')

const npmConfig = {
  registry: 'http://registry.npmjs.org/'
}

test('last release from registry', (t) => {
  t.test('get release from package name', (tt) => {
    lastRelease({
      name: 'available'
    }, npmConfig,
    (err, release) => {
      tt.error(err)
      tt.is(release.version, '1.33.7', 'version')
      tt.is(release.gitHead, 'HEAD', 'gitHead')

      tt.end()
    })
  })

  t.test('get release from scoped package name', (tt) => {
    lastRelease({
      name: '@scoped/available'
    }, npmConfig,
    (err, release) => {
      tt.error(err)
      tt.is(release.version, '1.33.7', 'version')
      tt.is(release.gitHead, 'HEAD', 'gitHead')

      tt.end()
    })
  })

  t.test('get nothing from not yet published package name', (tt) => {
    lastRelease({
      name: 'unavailable'
    }, npmConfig,
    (err, release) => {
      tt.error(err)
      tt.is(release.version, undefined, 'no version')

      tt.end()
    })
  })

  t.end()
})

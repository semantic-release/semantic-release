const test = require('tap').test

require('../mocks/registry')
const lastRelease = require('../../dist/lib/last-release')

const npmConfig = {
  registry: 'http://registry.npmjs.org'
}

test('last release from registry', (t) => {
  t.test('get release from package name', (t) => {
    lastRelease({
      name: 'available'
    }, npmConfig,
    (err, release) => {
      t.error(err)
      t.is(release.version, '1.33.7', 'version')
      t.is(release.gitHead, 'HEAD', 'gitHead')
    })
  })

  t.test('get release from scoped package name', (t) => {
    lastRelease({
      name: '@scoped/available'
    }, npmConfig,
    (err, release) => {
      t.error(err)
      t.is(release.version, '1.33.7', 'version')
      t.is(release.gitHead, 'HEAD', 'gitHead')
    })
  })

  t.test('get nothing from not yet published package name', (t) => {
    lastRelease({
      name: 'unavailable'
    }, npmConfig,
    (err, release) => {
      t.error(err)
      t.is(release.version, undefined, 'no version')
    })
  })
})

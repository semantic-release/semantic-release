const test = require('tap').test

const lastRelease = require('../../dist/lib/last-release')

test('last release from plugin', (t) => {
  t.plan(1)

  t.test('get release from package name', (tt) => {
    const config = {
      pkg: {name: 'available'},
      npm: {
        registry: 'http://registry.npmjs.org/',
        tag: 'latest'
      },
      something: 'else',
      foo: 'bar',
      plugins: {
        getLastRelease: (config, cb) => {
          tt.is(config.something, 'else', 'config')
          tt.is(config.foo, 'bar', 'config')
          cb('pizza', { version: '1.0.0', gitHead: 'HEAD' })
        }
      }
    }

    lastRelease(config, (err, release) => {
      tt.is(err, 'pizza', 'error')
      tt.is(release.version, '1.0.0', 'version')
      tt.is(release.gitHead, 'HEAD', 'gitHead')

      tt.end()
    })
  })
})

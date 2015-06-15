const test = require('tap').test
const proxyquire = require('proxyquire')

require('../mocks/registry')
const pre = proxyquire('../../dist/pre', {
  'child_process': require('../mocks/child-process')
})

const plugins = {
  verify: (release, cb) => cb(null, release),
  analyze: () => 'major'
}

test('full pre run', (t) => {
  t.test('increase version', (tt) => {
    pre({
      name: 'available'
    }, {
      registry: 'http://registry.npmjs.org'
    },
    plugins,
    (err, release) => {
      tt.error(err)
      tt.is(release.type, 'major')
      tt.is(release.version, '2.0.0')

      tt.end()
    })
  })

  t.test('increase version', (tt) => {
    pre({
      name: 'unavailable'
    }, {
      registry: 'http://registry.npmjs.org'
    },
    plugins,
    (err, release) => {
      tt.error(err)
      tt.is(release.type, 'initial')
      tt.is(release.version, '1.0.0')

      tt.end()
    })
  })

  t.end()
})

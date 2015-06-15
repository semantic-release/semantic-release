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
  t.test('increase version', (t) => {
    pre({
      name: 'available'
    }, {
      registry: 'http://registry.npmjs.org'
    },
    plugins,
    (err, release) => {
      t.error(err)
      t.is(release.type, 'major')
      t.is(release.version, '2.0.0')
    })
  })

  t.test('increase version', (t) => {
    pre({
      name: 'unavailable'
    }, {
      registry: 'http://registry.npmjs.org'
    },
    plugins,
    (err, release) => {
      t.error(err)
      t.is(release.type, 'initial')
      t.is(release.version, '1.0.0')
    })
  })
})

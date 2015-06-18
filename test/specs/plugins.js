const test = require('tap').test

const { normalize } = require('../../dist/lib/plugins')

test('normalize and load plugin', function (t) {

  t.test('load from string', (tt) => {
    const plugin = normalize('../../dist/lib/plugin-noop')

    tt.is(typeof plugin, 'function')

    tt.end()
  })

  t.test('load from object', (tt) => {
    const plugin = normalize({
      path: '../../dist/lib/plugin-noop'
    })

    tt.is(typeof plugin, 'function')

    tt.end()
  })

  t.test('load from object', (tt) => {
    const plugin = normalize(null, '../../dist/lib/plugin-noop')

    tt.is(typeof plugin, 'function')

    tt.end()
  })
})

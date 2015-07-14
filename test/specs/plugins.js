const test = require('tap').test

const plugins = require('../../dist/lib/plugins')

test('export plugins', (t) => {
  t.plan(4)

  const defaultPlugins = plugins({})

  t.is(typeof defaultPlugins.analyzeCommits, 'function')
  t.is(typeof defaultPlugins.generateNotes, 'function')
  t.is(typeof defaultPlugins.verifyConditions, 'function')
  t.is(typeof defaultPlugins.verifyRelease, 'function')
})

test('normalize and load plugin', (t) => {

  t.test('load from string', (tt) => {
    const plugin = plugins.normalize('./dist/lib/plugin-noop')

    tt.is(typeof plugin, 'function')

    tt.end()
  })

  t.test('load from object', (tt) => {
    const plugin = plugins.normalize({
      path: './dist/lib/plugin-noop'
    })

    tt.is(typeof plugin, 'function')

    tt.end()
  })

  t.test('load from object', (tt) => {
    const plugin = plugins.normalize(null, '../../dist/lib/plugin-noop')

    tt.is(typeof plugin, 'function')

    tt.end()
  })
})

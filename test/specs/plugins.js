const test = require('tap').test

const plugins = require('../../dist/lib/plugins')

test('export plugins', (t) => {
  t.plan(5)

  const defaultPlugins = plugins({})

  t.is(typeof defaultPlugins.analyzeCommits, 'function')
  t.is(typeof defaultPlugins.generateNotes, 'function')
  t.is(typeof defaultPlugins.verifyConditions, 'function')
  t.is(typeof defaultPlugins.verifyRelease, 'function')
  t.is(typeof defaultPlugins.getLastRelease, 'function')
})

test('plugin pipelines', (t) => {
  t.plan(3)

  t.test('get all results', (tt) => {
    const pipelinePlugins = plugins({
      verifyRelease: [
        './dist/lib/plugin-noop',
        './.test/mocks/plugin-result-a',
        './.test/mocks/plugin-result-b'
      ]
    })

    pipelinePlugins.verifyRelease({}, (err, results) => {
      tt.error(err)
      tt.same(results, [undefined, 'a', 'b'])
      tt.end()
    })
  })

  t.test('get first error', (tt) => {
    const pipelinePlugins = plugins({
      verifyConditions: [
        './dist/lib/plugin-noop',
        './.test/mocks/plugin-error-a',
        './.test/mocks/plugin-error-b'
      ]
    })

    pipelinePlugins.verifyConditions({}, (err) => {
      tt.is(err.message, 'a')
      tt.end()
    })
  })

  t.test('get error and only results before', (tt) => {
    const pipelinePlugins = plugins({
      verifyRelease: [
        './dist/lib/plugin-noop',
        './.test/mocks/plugin-result-a',
        './.test/mocks/plugin-error-b',
        './.test/mocks/plugin-result-b'
      ]
    })

    pipelinePlugins.verifyRelease({}, (err, results) => {
      tt.is(err.message, 'b')
      tt.same(results, [undefined, 'a', undefined])
      tt.end()
    })
  })
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

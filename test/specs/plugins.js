var test = require('tap').test

var plugins = require('../../src/lib/plugins')

test('export plugins', function (t) {
  t.plan(5)

  var defaultPlugins = plugins({})

  t.is(typeof defaultPlugins.analyzeCommits, 'function')
  t.is(typeof defaultPlugins.generateNotes, 'function')
  t.is(typeof defaultPlugins.verifyConditions, 'function')
  t.is(typeof defaultPlugins.verifyRelease, 'function')
  t.is(typeof defaultPlugins.getLastRelease, 'function')
})

test('plugin pipelines', function (t) {
  t.plan(3)

  t.test('get all results', function (tt) {
    var pipelinePlugins = plugins({
      verifyRelease: [
        './src/lib/plugin-noop',
        './test/mocks/plugin-result-a',
        './test/mocks/plugin-result-b'
      ]
    })

    pipelinePlugins.verifyRelease({}, function (err, results) {
      tt.error(err)
      tt.same(results, [undefined, 'a', 'b'])
      tt.end()
    })
  })

  t.test('get first error', function (tt) {
    var pipelinePlugins = plugins({
      verifyConditions: [
        './src/lib/plugin-noop',
        './test/mocks/plugin-error-a',
        './test/mocks/plugin-error-b'
      ]
    })

    pipelinePlugins.verifyConditions({}, function (err) {
      tt.is(err.message, 'a')
      tt.end()
    })
  })

  t.test('get error and only results before', function (tt) {
    var pipelinePlugins = plugins({
      verifyRelease: [
        './src/lib/plugin-noop',
        './test/mocks/plugin-result-a',
        './test/mocks/plugin-error-b',
        './test/mocks/plugin-result-b'
      ]
    })

    pipelinePlugins.verifyRelease({}, function (err, results) {
      tt.is(err.message, 'b')
      tt.same(results, [undefined, 'a', undefined])
      tt.end()
    })
  })
})

test('normalize and load plugin', function (t) {
  t.test('load from string', function (tt) {
    var plugin = plugins.normalize('./src/lib/plugin-noop')

    tt.is(typeof plugin, 'function')

    tt.end()
  })

  t.test('load from object', function (tt) {
    var plugin = plugins.normalize({
      path: './src/lib/plugin-noop'
    })

    tt.is(typeof plugin, 'function')

    tt.end()
  })

  t.test('load from fallback', function (tt) {
    var plugin = plugins.normalize(null, '../../src/lib/plugin-noop')

    tt.is(typeof plugin, 'function')

    tt.end()
  })

  t.end()
})

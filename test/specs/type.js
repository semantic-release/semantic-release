var test = require('tap').test

var type = require('../../src/lib/type')

test('get type from commits', function (t) {
  t.test('get type from plugin', function (tt) {
    tt.plan(2)

    type({
      commits: [{
        hash: '0',
        message: 'a'
      }],
      lastRelease: {version: '1.0.0'},
      plugins: {
        analyzeCommits: function (config, cb) {
          cb(null, 'major')
        }
      }
    }, function (err, type) {
      tt.error(err)
      tt.is(type, 'major')
    })
  })

  t.test('error when no changes', function (tt) {
    tt.plan(1)

    type({
      commits: [],
      lastRelease: {},
      plugins: {
        analyzeCommits: function (config, cb) {
          cb(null, null)
        }
      }
    }, function (err) {
      tt.is(err.code, 'ENOCHANGE')
    })
  })

  t.test('initial version', function (tt) {
    tt.plan(2)

    type({
      commits: [],
      lastRelease: {},
      plugins: {
        analyzeCommits: function (config, cb) {
          cb(null, 'major')
        }
      }
    }, function (err, type) {
      tt.error(err)
      tt.is(type, 'initial')
    })
  })

  t.end()
})

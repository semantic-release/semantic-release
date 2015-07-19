const test = require('tap').test

const type = require('../../dist/lib/type')

test('get type from commits', (t) => {
  t.test('get type from plugin', (tt) => {
    tt.plan(2)

    type({
      commits: [{
        hash: '0',
        message: 'a'
      }],
      lastRelease: {version: '1.0.0'},
      plugins: {analyzeCommits: (config, cb) => cb(null, 'major')}
    }, (err, type) => {
      tt.error(err)
      tt.is(type, 'major')
    })
  })

  t.test('error when no changes', (tt) => {
    tt.plan(1)

    type({
      commits: [],
      lastRelease: {},
      plugins: {analyzeCommits: (config, cb) => cb(null, null)}
    }, (err) => {
      tt.is(err.code, 'ENOCHANGE')
    })
  })

  t.test('initial version', (tt) => {
    tt.plan(2)

    type({
      commits: [],
      lastRelease: {},
      plugins: {analyzeCommits: (config, cb) => cb(null, 'major')}
    }, (err, type) => {
      tt.error(err)
      tt.is(type, 'initial')
    })
  })

  t.end()
})

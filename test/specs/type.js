const test = require('tap').test

const type = require('../../dist/lib/type')

test('get type from commits', (t) => {
  t.test('get type from plugin', (tt) => {
    tt.plan(2)

    type({
      analyzeCommits: (commits, cb) => cb(null, 'major')
    }, [{
      hash: '0',
      message: 'a'
    }], {
      version: '1.0.0'
    }, (err, type) => {
      tt.error(err)
      tt.is(type, 'major')
    })
  })

  t.test('error when no changes', (tt) => {
    tt.plan(1)

    type({
      analyzeCommits: (commits, cb) => cb(null, null)
    }, [], {},
    (err) => {
      tt.is(err.code, 'ENOCHANGE')
    })
  })

  t.test('initial version', (tt) => {
    tt.plan(2)

    type({
      analyzeCommits: (commits, cb) => cb(null, 'major')
    }, [], {},
    (err, type) => {
      tt.error(err)
      tt.is(type, 'initial')
    })
  })

  t.end()
})

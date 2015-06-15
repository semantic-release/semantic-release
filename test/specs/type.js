const test = require('tap').test

const type = require('../../dist/lib/type')

test('get type from commits', (t) => {
  t.test('get type from plugin', (tt) => {
    type({
      analyze: () => 'major'
    }, [{
      hash: '0',
      message: 'a'
    }], {
      version: '1.0.0'
    }, (err, type) => {
      tt.error(err)
      tt.is(type, 'major')

      tt.end()
    })
  })

  t.test('error when no changes', (tt) => {
    type({
      analyze: () => null
    }, [], {},
    (err) => {
      tt.is(err.code, 'ENOCHANGE')

      tt.end()
    })
  })

  t.test('initial version', (tt) => {
    type({
      analyze: () => 'major'
    }, [], {},
    (err, type) => {
      tt.error(err)
      tt.is(type, 'initial')

      tt.end()
    })
  })

  t.end()
})

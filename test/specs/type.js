const test = require('tap').test

const type = require('../../dist/lib/type')

test('get type from commits', (t) => {
  t.test('get type from plugin', (t) => {
    type({
      analyze: () => 'major'
    }, [{
      hash: '0',
      message: 'a'
    }], {
      version: '1.0.0'
    }, (err, type) => {
      t.error(err)
      t.is(type, 'major')
    })
  })

  t.test('error when no changes', (t) => {
    type({
      analyze: () => null
    }, [], {},
    (err) => {
      t.is(err.code, 'ENOCHANGE')
    })
  })

  t.test('initial version', (t) => {
    type({
      analyze: () => 'major'
    }, [], {},
    (err, type) => {
      t.error(err)
      t.is(type, 'initial')
    })
  })
})

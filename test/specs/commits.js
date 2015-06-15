const test = require('tap').test
const proxyquire = require('proxyquire')

const commits = proxyquire('../../dist/lib/commits', {
  'child_process': require('../mocks/child-process')
})

test('commits since last release', (t) => {
  t.test('get all commits', (t) => {
    commits({lastRelease: {}}, (err, commits) => {
      t.error(err)
      t.is(commits.length, 2, 'all commits')
      t.is(commits[0].hash, 'hash-one', 'parsed hash')
      t.is(commits[1].message, 'commit-two', 'parsed message')
    })
  })

  t.test('get commits since hash', (t) => {
    commits({lastRelease: {gitHead: 'hash'}}, (err, commits) => {
      t.error(err)
      t.is(commits.length, 1, 'specified commits')
      t.is(commits[0].hash, 'hash-one', 'parsed hash')
      t.is(commits[0].message, 'commit-one', 'parsed message')
    })
  })
})

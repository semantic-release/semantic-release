const test = require('tap').test
const proxyquire = require('proxyquire')

const commits = proxyquire('../../dist/lib/commits', {
  'child_process': require('../mocks/child-process')
})

test('commits since last release', (t) => {
  t.test('get all commits', (tt) => {
    commits({lastRelease: {}, options: {branch: 'master'}}, (err, commits) => {
      tt.error(err)
      tt.is(commits.length, 2, 'all commits')
      tt.is(commits[0].hash, 'hash-one', 'parsed hash')
      tt.is(commits[1].message, 'commit-two', 'parsed message')

      tt.end()
    })
  })

  t.test('get commits since hash', (tt) => {
    commits({lastRelease: {gitHead: 'hash'}, options: {branch: 'master'}}, (err, commits) => {
      tt.error(err)
      tt.is(commits.length, 1, 'specified commits')
      tt.is(commits[0].hash, 'hash-one', 'parsed hash')
      tt.is(commits[0].message, 'commit-one', 'parsed message')

      tt.end()
    })
  })

  t.test('get commits since hash', (tt) => {
    commits({lastRelease: {gitHead: 'notinhistory'}, options: {branch: 'notmaster'}}, (err, commits) => {
      tt.ok(err)
      tt.is(err.code, 'ENOTINHISTORY')
      tt.end()
    })
  })

  t.end()
})

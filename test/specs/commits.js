var test = require('tap').test
var proxyquire = require('proxyquire')

var commits = proxyquire('../../src/lib/commits', {
  'npmlog': {
    error: function () {}
  },
  'child_process': require('../mocks/child-process')
})

test('commits since last release', function (t) {
  t.test('get all commits', function (tt) {
    commits({lastRelease: {}, options: {branch: 'master'}}, function (err, commits) {
      tt.error(err)
      tt.is(commits.length, 2, 'all commits')
      tt.is(commits[0].hash, 'hash-one', 'parsed hash')
      tt.is(commits[1].message, 'commit-two', 'parsed message')

      tt.end()
    })
  })

  t.test('get commits since hash', function (tt) {
    commits({lastRelease: {gitHead: 'hash'}, options: {branch: 'master'}}, function (err, commits) {
      tt.error(err)
      tt.is(commits.length, 1, 'specified commits')
      tt.is(commits[0].hash, 'hash-one', 'parsed hash')
      tt.is(commits[0].message, 'commit-one', 'parsed message')

      tt.end()
    })
  })

  t.test('get commits since hash', function (tt) {
    commits({lastRelease: {gitHead: 'notinhistory'}, options: {branch: 'notmaster'}}, function (err, commits) {
      tt.ok(err)
      tt.is(err.code, 'ENOTINHISTORY')
      tt.end()
    })
  })

  t.end()
})

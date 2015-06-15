const test = require('tap').test
const proxyquire = require('proxyquire')

const rawCommits = [
  'hash-one==SPLIT==commit-one==END==\n',
  'hash-two==SPLIT==commit-two==END==\n'
]
const commits = proxyquire('../../dist/lib/commits.js', {
  'child_process': {
    exec: (command, cb) => {
      cb(
        null,
        /\.\.HEAD/.test(command) ?
          rawCommits[0] :
          rawCommits.join()
      )
    },
    '@noCallThru': true
  }
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

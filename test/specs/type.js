const test = require('tap').test

const type = require('../../dist/lib/type')

test('get type from commits', (t) => {
  t.plan(5)

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

  t.test('plugin called for each commit and tracks changes', (tt) => {
    tt.plan(2)
    let pluginCalledTimes = 0
    type({
      commits: [{
        hash: '0',
        message: 'a'
      },
      {
        hash: '1',
        message: 'b'
      },
      {
        hash: '2',
        message: 'c'
      },
      {
        hash: '3',
        message: 'd'
      }],
      lastRelease: {},
      plugins: {analyzeCommits: (config, cb) => {
        cb(null, ['minor', false, 'major', 'patch'][pluginCalledTimes++])
      }
      }
    }, (err, type) => {
      tt.error(err)
      tt.is(pluginCalledTimes, 4)
      tt.is(type, 'major')
    })
  })

  t.test('error when skipped', (tt) => {
    tt.plan(1)

    type({
      commits: [],
      lastRelease: {},
      plugins: {analyzeCommits: (config, cb) => cb(null, 'rskip')}
    }, (err) => {
      tt.is(err.code, 'ERELSKIP')
    })
  })

  t.end()
})

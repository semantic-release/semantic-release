var test = require('tap').test
var proxyquire = require('proxyquire')

require('../mocks/registry')
var pre = proxyquire('../../src/pre', {
  './lib/commits': proxyquire('../../src/lib/commits', {
    'child_process': require('../mocks/child-process')
  })
})

var versions = {
  available: '1.0.0'
}

var plugins = {
  verifyRelease: function (release, cb) {
    cb(null, release)
  },
  analyzeCommits: function (commits, cb) {
    cb(null, 'major')
  },
  getLastRelease: function (config, cb) {
    cb(null, {version: versions[config.pkg.name] || null, gitHead: 'HEAD'})
  }
}

var npm = {
  registry: 'http://registry.npmjs.org/',
  tag: 'latest'
}

test('full pre run', function (t) {
  t.test('increase version', function (tt) {
    tt.plan(3)

    pre({
      options: {branch: 'master'},
      npm: npm,
      pkg: {name: 'available'},
      plugins: plugins
    }, function (err, release) {
      tt.error(err)
      tt.is(release.type, 'major')
      tt.is(release.version, '2.0.0')
    })
  })

  t.test('increase version', function (tt) {
    tt.plan(3)

    pre({
      options: {branch: 'master'},
      npm: npm,
      pkg: {name: 'unavailable'},
      plugins: plugins
    }, function (err, release) {
      tt.error(err)
      tt.is(release.type, 'initial')
      tt.is(release.version, '1.0.0')
    })
  })

  t.end()
})

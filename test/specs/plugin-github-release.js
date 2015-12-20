var defaults = require('lodash').defaults
var test = require('tap').test
var proxyquire = require('proxyquire')

var postRelease = proxyquire('../../src/lib/plugin-github-release.js', {
  'git-head': require('../mocks/git-head'),
  github: require('../mocks/github')
})

var pkg = {
  version: '1.0.0',
  repository: {url: 'http://github.com/whats/up.git'}
}

var plugins = {generateNotes: function (pkg, cb) { return cb(null, 'the log') }}

var defaultRelease = {
  owner: 'whats',
  repo: 'up',
  name: 'v1.0.0',
  tag_name: 'v1.0.0',
  target_commitish: 'bar',
  body: 'the log'
}

test('generateNodes', function (t) {
  t.test('error', function (tt) {
    var modifiedPlugins = {generateNotes: function (pkg, cb) { return cb(new Error('An error with generateNotes has occured')) }}

    postRelease({}, {
      options: {debug: false},
      pkg: pkg,
      plugins: modifiedPlugins
    }, function (err) {
      tt.match(err.message, 'An error with generateNotes has occured')

      tt.end()
    })
  })

  t.end()
})

test('gitHead', function (t) {
  t.test('error', function (tt) {
    var modifiedPostRelease = proxyquire('../../src/lib/plugin-github-release.js', {
      'git-head': require('../mocks/git-head').error,
      github: require('../mocks/github')
    })

    modifiedPostRelease({}, {
      options: {debug: false},
      pkg: pkg,
      plugins: plugins
    }, function (err) {
      tt.match(err.message, 'An error with gitHead has occured')

      tt.end()
    })
  })

  t.end()
})

test('github', function (t) {
  t.test('error with createRelease', function (tt) {
    var modifiedPostRelease = proxyquire('../../src/lib/plugin-github-release.js', {
      'git-head': require('../mocks/git-head'),
      github: require('../mocks/github').error
    })

    modifiedPostRelease({}, {
      options: {debug: false},
      pkg: pkg,
      plugins: plugins
    }, function (err) {
      tt.match(err.message, 'An error with createRelease has occured')

      tt.end()
    })
  })

  t.test('GitHub Enterprise URL', function (tt) {
    postRelease({}, {
      options: {githubToken: 'yo', githubUrl: 'https://github.com'},
      pkg: pkg,
      plugins: plugins
    }, function (err, release) {
      tt.error(err)
      tt.match(release, defaultRelease)

      tt.end()
    })
  })

  t.end()
})

test('full postRelease run', function (t) {
  t.test('in debug mode', function (tt) {
    postRelease({}, {
      options: {debug: true},
      pkg: pkg,
      plugins: plugins
    }, function (err, release) {
      tt.error(err)
      tt.match(release, defaults({draft: true}, defaultRelease))

      tt.end()
    })
  })

  t.test('production', function (tt) {
    postRelease({}, {
      options: {githubToken: 'yo'},
      pkg: pkg,
      plugins: plugins
    }, function (err, release) {
      tt.error(err)
      tt.match(release, defaultRelease)

      tt.end()
    })
  })

  t.end()
})

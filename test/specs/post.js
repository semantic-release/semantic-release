var defaults = require('lodash').defaults
var test = require('tap').test
var proxyquire = require('proxyquire')

var post = proxyquire('../../src/post', {
  'git-head': require('../mocks/git-head'),
  github: require('../mocks/github')
})

var pkg = {
  version: '1.0.0',
  repository: {url: 'http://github.com/whats/up.git'}
}

var customTagPkg = {
  version: '1.0.0',
  repository: {url: 'http://github.com/whats/up.git'},
  publishConfig: {
    tag: 'beta'
  }
}

var plugins = {
  generateNotes: function (pkg, cb) {
    cb(null, 'the log')
  }
}

var defaultRelease = {
  owner: 'whats',
  repo: 'up',
  name: 'v1.0.0',
  tag_name: 'v1.0.0',
  target_commitish: 'master',
  body: 'the log'
}

test('full post run', function (t) {
  t.test('in debug mode w/o token', function (tt) {
    post({
      options: {debug: true, branch: 'master'},
      pkg: pkg,
      plugins: plugins
    }, function (err, published, release) {
      tt.error(err)
      tt.is(published, false)
      tt.match(release, defaults({draft: true}, defaultRelease))

      tt.end()
    })
  })

  t.test('in debug mode w/token', function (tt) {
    post({
      options: {debug: true, githubToken: 'yo', branch: 'master'},
      pkg: pkg,
      plugins: plugins
    }, function (err, published, release) {
      tt.error(err)
      tt.is(published, true)
      tt.match(release, defaults({draft: true}, defaultRelease))

      tt.end()
    })
  })

  t.test('production', function (tt) {
    post({
      options: {githubToken: 'yo', branch: 'master'},
      pkg: pkg,
      plugins: plugins
    }, function (err, published, release) {
      tt.error(err)
      tt.is(published, true)
      tt.match(release, defaultRelease)

      tt.end()
    })
  })

  t.test('production with custom tag', function (tt) {
    post({
      options: {githubToken: 'yo', branch: 'master'},
      pkg: customTagPkg,
      plugins: plugins
    }, function (err, published, release) {
      tt.error(err)
      tt.is(published, true)
      tt.match(release, defaultRelease)
      tt.end()
    })
  })

  t.end()
})

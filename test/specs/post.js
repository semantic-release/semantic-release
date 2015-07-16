const { defaults } = require('lodash')
const test = require('tap').test
const proxyquire = require('proxyquire')

const post = proxyquire('../../dist/post', {
  'git-head': require('../mocks/git-head'),
  github: require('../mocks/github')
})

const pkg = {
  version: '1.0.0',
  repository: {
    url: 'http://github.com/whats/up.git'
  }
}

const plugins = {
  generateNotes: (pkg, cb) => cb(null, 'the log')
}

const defaultRelease = {
  owner: 'whats',
  repo: 'up',
  name: 'v1.0.0',
  tag_name: 'v1.0.0',
  target_commitish: 'bar',
  body: 'the log'
}

test('full post run', (t) => {
  t.test('in debug mode w/o token', (tt) => {
    post(pkg, {debug: true}, plugins, (err, published, release) => {
      tt.error(err)
      tt.is(published, false)
      tt.match(release, defaults({draft: true}, defaultRelease))

      tt.end()
    })
  })

  t.test('in debug mode w token', (tt) => {
    post(pkg, {debug: true, 'github-token': 'yo'}, plugins, (err, published, release) => {
      tt.error(err)
      tt.is(published, true)
      tt.match(release, defaults({draft: true}, defaultRelease))

      tt.end()
    })
  })

  t.test('production', (tt) => {
    post(pkg, {'github-token': 'yo'}, plugins, (err, published, release) => {
      tt.error(err)
      tt.is(published, true)
      tt.match(release, defaultRelease)

      tt.end()
    })
  })
})

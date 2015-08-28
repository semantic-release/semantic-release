const { test } = require('tap')
const verify = require('../../dist/lib/plugin-verify-github')

test('raise errors if github configuration is missing or malformed', (t) => {

  t.test('malformed package repo', (tt) => {
    verify({}, {
      pkg: {},
      githubToken: 'validToken'
    }, (err) => {

      tt.is(err.length, 1)
      tt.is(err[0].code, 'ENOPKGREPO')
    })

    verify({}, {
      pkg: {
        repository: {
          url: 'malformedurl'
        }
      },
      githubToken: 'validToken'
    }, (err) => {

      tt.is(err.length, 1)
      tt.is(err[0].code, 'EMALFORMEDPKGREPO')
    })
  })

  t.test('missing github token', (tt) => {
    verify({}, {
      pkg: {
        repository: {
          url: 'http://github.com/whats/up.git'
        }
      }
    }, (err) => {

      tt.is(err.length, 1)
      tt.is(err[0].code, 'ENOGHTOKEN')
    })
  })

  t.test('no errors', (tt) => {
    verify({}, {
      pkg: {
        repository: {
          url: 'http://github.com/whats/up.git'
        }
      },
      githubToken: 'validToken'
    }, (err) => {

      tt.is(err.length, 0)
    })
  })
})

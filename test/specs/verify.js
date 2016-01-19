var test = require('tap').test

var verify = require('../../src/lib/verify')

test('verify pkg, options and env', function (t) {
  t.plan(3)

  t.test('dry run verification', function (tt) {
    tt.plan(4)

    verify(null, {
      options: {debug: true},
      pkg: {
        name: 'package',
        repository: {
          url: 'http://github.com/whats/up.git'
        }
      }
    }, function (noErrors) {
      tt.is(noErrors.length, 0)
    })

    verify(null, {
      options: {debug: true},
      pkg: {}
    }, function (errors) {
      tt.is(errors.length, 2)
      tt.is(errors[0].code, 'ENOPKGNAME')
      tt.is(errors[1].code, 'ENOPKGREPO')
    })
  })

  t.test('dry run verification for gitlab repo', function (tt) {
    tt.plan(1)

    verify(null, {
      options: {debug: true},
      pkg: {
        name: 'package',
        repository: {
          url: 'http://gitlab.corp.com/whats/up.git'
        }
      }
    }, function (noErrors) {
      tt.is(noErrors.length, 0)
    })
  })

  t.test('publish verification', function (tt) {
    tt.plan(6)

    verify(null, {
      env: {NPM_TOKEN: 'yo'},
      options: {githubToken: 'sup'},
      pkg: {
        name: 'package',
        repository: {
          url: 'http://github.com/whats/up.git'
        }
      }
    }, function (noErrors) {
      tt.is(noErrors.length, 0)
    })

    verify(null, {env: {}, options: {}, pkg: {}}, function (errors) {
      tt.is(errors.length, 4)
      tt.is(errors[0].code, 'ENOPKGNAME')
      tt.is(errors[1].code, 'ENOPKGREPO')
      tt.is(errors[2].code, 'ENOGHTOKEN')
      tt.is(errors[3].code, 'ENONPMTOKEN')
    })
  })
})

var test = require('tap').test

var verify = require('../../src/lib/verify')

test('verify pkg, options and env', function (t) {
  t.test('dry run verification', function (tt) {
    var noErrors = verify({
      options: {debug: true},
      pkg: {
        name: 'package',
        repository: {
          url: 'http://github.com/whats/up.git'
        }
      }
    })

    tt.is(noErrors.length, 0)

    var errors = verify({
      options: {debug: true},
      pkg: {}
    })

    tt.is(errors.length, 2)
    tt.is(errors[0].code, 'ENOPKGNAME')
    tt.is(errors[1].code, 'ENOPKGREPO')

    tt.end()
  })

  t.test('dry run verification for gitlab repo', function (tt) {
    var noErrors = verify({
      options: {debug: true},
      pkg: {
        name: 'package',
        repository: {
          url: 'http://gitlab.corp.com/whats/up.git'
        }
      }
    })

    console.log(noErrors)
    tt.is(noErrors.length, 0)
    tt.end()
  })

  t.test('publish verification', function (tt) {
    var noErrors = verify({
      env: {NPM_TOKEN: 'yo'},
      options: {githubToken: 'sup'},
      pkg: {
        name: 'package',
        repository: {
          url: 'http://github.com/whats/up.git'
        }
      }
    })

    tt.is(noErrors.length, 0)

    var allErrors = verify({env: {}, options: {}, pkg: {}})

    tt.is(allErrors.length, 4)
    tt.is(allErrors[0].code, 'ENOPKGNAME')
    tt.is(allErrors[1].code, 'ENOPKGREPO')
    tt.is(allErrors[2].code, 'ENOGHTOKEN')
    tt.is(allErrors[3].code, 'ENONPMTOKEN')

    var allButNpmTokenErrors = verify({env: {}, options: { createNpmrc: false }, pkg: {}})

    tt.is(allButNpmTokenErrors.length, 3)
    tt.is(allButNpmTokenErrors[0].code, 'ENOPKGNAME')
    tt.is(allButNpmTokenErrors[1].code, 'ENOPKGREPO')
    tt.is(allButNpmTokenErrors[2].code, 'ENOGHTOKEN')

    tt.end()
  })

  t.end()
})

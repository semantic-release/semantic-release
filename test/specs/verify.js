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

    var errors2 = verify({
      options: {debug: true},
      pkg: {
        name: 'package',
        repository: {
          url: 'lol'
        }
      }
    })

    tt.is(errors2.length, 1)
    tt.is(errors2[0].code, 'EMALFORMEDPKGREPO')

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

    var errors = verify({env: {}, options: {}, pkg: {}})

    tt.is(errors.length, 4)
    tt.is(errors[0].code, 'ENOPKGNAME')
    tt.is(errors[1].code, 'ENOPKGREPO')
    tt.is(errors[2].code, 'ENOGHTOKEN')
    tt.is(errors[3].code, 'ENONPMTOKEN')

    tt.end()
  })

  t.end()
})

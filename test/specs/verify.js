const test = require('tap').test

const verify = require('../../dist/lib/verify')

test('verify pkg, options and env', (t) => {
  t.test('dry run verification', (tt) => {
    const noErrors = verify({
      name: 'package',
      repository: {
        url: 'http://github.com/whats/up.git'
      }
    }, {
      debug: true
    }, {})

    tt.is(noErrors.length, 0)

    const errors = verify({}, {
      debug: true
    }, {})

    tt.is(errors.length, 2)
    tt.is(errors[0].code, 'ENOPKGNAME')
    tt.is(errors[1].code, 'ENOPKGREPO')

    const errors2 = verify({
      name: 'package',
      repository: {
        url: 'lol'
      }
    }, {
      debug: true
    }, {})

    tt.is(errors2.length, 1)
    tt.is(errors2[0].code, 'EMALFORMEDPKGREPO')

    tt.end()
  })

  t.test('publish verification', (tt) => {
    const noErrors = verify({
      name: 'package',
      repository: {
        url: 'http://github.com/whats/up.git'
      }
    }, {
      'github-token': 'sup'
    }, {
      NPM_TOKEN: 'yo'
    })

    tt.is(noErrors.length, 0)

    const errors = verify({}, {}, {})

    tt.is(errors.length, 4)
    tt.is(errors[0].code, 'ENOPKGNAME')
    tt.is(errors[1].code, 'ENOPKGREPO')
    tt.is(errors[2].code, 'ENOGHTOKEN')
    tt.is(errors[3].code, 'ENONPMTOKEN')

    tt.end()
  })
})

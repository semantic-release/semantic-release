'use strict'

var efh = require('error-first-handler')
var nixt = require('nixt')

module.exports = function (test, createModule) {
  test('verify', function (t) {
    createModule({
      repository: {},
      scripts: {
        prepublish: 'semantic-release pre --no-token'
      }
    }, efh()(function (name, cwd) {
      t.test('verify package and options before publishing', function (t) {
        t.plan(1)
        nixt()
          .cwd(cwd)
          .env('CI', true)
          .run('npm publish')
          .stderr(new RegExp(
            'You must define a GitHub token\.\n' +
            'You must define your GitHub "repository" inside the "package.json"\.\n' +
            'You must define your "scripts" inside the "package.json"\.'
            , 'm'
          ))
          .code(1)
          .end(function (err) {
            t.error(err, 'nixt')
          })
      })
    }))

    createModule({
      version: '1.0.0-semantically-released'
    }, efh()(function (name, cwd) {
      t.test('not publishing placeholder versions', function (t) {
        t.plan(1)

        nixt()
          .cwd(cwd)
          .env('CI', true)
          .run('npm publish --semantic-release-rerun')
          .code(1)
          .end(function (err) {
            t.error(err, 'nixt')
          })
      })
    }))
  })
}

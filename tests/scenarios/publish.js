'use strict'

var efh = require('error-first-handler')
var nixt = require('nixt')
var test = require('tape')

var createModule = require('../lib/create-module')

module.exports = function () {
  test('publish', function (t) {
    publishTest(t, 'npm publish', 'pre and post hooks work as a part of publish')
    publishTest(t, 'npm pub', 'pre and post hooks work as a part of publish with abbrevd command')

    function publishTest (t, command, testname, last) {
      createModule({
        repository: {
          type: 'git',
          url: 'http://github.com/user/repo'
        }
      }, efh()(function (name, cwd) {
        t.test(testname, function (t) {
          t.plan(1)

          nixt()
            .cwd(cwd)
            .env('CI', true)
            .env('GH_URL', 'http://127.0.0.1:4343/')
            .env('GH_TOKEN', '***')
            .exec('git commit --allow-empty -m "feat: super"')
            .run(command)
            .code(1)
            .stdout(/Everything is alright/)
            .end(function (err) {
              t.error(err, 'nixt')
            })
        })
      }))
    }
  })
}

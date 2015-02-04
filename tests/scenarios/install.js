'use strict'

var fs = require('fs')

var efh = require('error-first-handler')
var nixt = require('nixt')

module.exports = function (test, createModule) {
  createModule(efh()(function (name, cwd) {
    test('install', function (t) {
      installTest(t, 'npm install', 'not doing anything when the module is installed')
      installTest(t, 'npm i', 'not doing anything when the module is installed with abbrevd command')
    })

    function installTest (t, command, name, last) {
      t.test(name, function (t) {
        t.plan(2)

        var pkg = fs.readFileSync(cwd + '/package.json')

        nixt()
          .cwd(cwd)
          .run(command)
          .code(0)
          .stdout(/> semantic-release pre\n$/m)
          .end(function(err) {
            t.is(pkg + '', fs.readFileSync(cwd + '/package.json') + '', 'package')
            t.error(err, 'nixt')
          })
      })
    }
  }))
}

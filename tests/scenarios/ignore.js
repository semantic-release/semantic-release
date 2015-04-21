'use strict'

var fs = require('fs')

var efh = require('error-first-handler')
var nixt = require('nixt')

module.exports = function (test, createModule) {
  createModule(efh()(function (name, cwd) {
    test('ignore', function (t) {
      ignoreTest(t, 'npm install', 'not doing anything when the module is installed')
      ignoreTest(t, 'npm i', 'not doing anything when the module is installed with abbrevd command')
      ignoreTest(t, 'npm link', 'not doing anything when the module is linked')
      ignoreTest(t, 'npm lin', 'not doing anything when the module is linked with abbrevd command')
      ignoreTest(t, 'npm pack', 'not doing anything when the module is packed')
      ignoreTest(t, 'npm pa', 'not doing anything when the module is packed with abbrevd command')
    })

    function ignoreTest (t, command, name, last) {
      t.test(name, function (t) {
        t.plan(2)

        var pkg = fs.readFileSync(cwd + '/package.json')

        nixt()
          .cwd(cwd)
          .run(command)
          .code(0)
          .stdout(/> semantic-release pre\n$/m)
          .end(function (err) {
            t.is(pkg + '', fs.readFileSync(cwd + '/package.json') + '', 'package')
            t.error(err, 'nixt')
          })
      })
    }
  }))
}

'use strict'

var fs = require('fs')

var efh = require('error-first-handler')
var nixt = require('nixt')
var test = require('tap').test

var createModule = require('../lib/create-module')

test('ignore', function (t) {
  createModule(efh()(function (name, cwd) {
    ignoreTest(t, cwd, 'npm install', 'not doing anything when the module is installed')
    ignoreTest(t, cwd, 'npm i', 'not doing anything when the module is installed with abbrevd command')
    ignoreTest(t, cwd, 'npm link', 'not doing anything when the module is linked')
    ignoreTest(t, cwd, 'npm lin', 'not doing anything when the module is linked with abbrevd command')
    ignoreTest(t, cwd, 'npm pack', 'not doing anything when the module is packed')
    ignoreTest(t, cwd, 'npm pa', 'not doing anything when the module is packed with abbrevd command')
  }))
})

function ignoreTest (t, cwd, command, name) {
  t.test(name, function (t) {
    t.plan(2)

    var pkg = fs.readFileSync(cwd + '/package.json')

    nixt()
      .cwd(cwd)
      .run(command)
      .code(0)
      .stdout(/semantic-release.js pre\n$/m)
      .end(function (err) {
        t.is(pkg + '', fs.readFileSync(cwd + '/package.json') + '', 'package')
        t.error(err, 'nixt')
      })
  })
}

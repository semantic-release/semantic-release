'use strict'

var exec = require('child_process').exec
var join = require('path').join

var efh = require('error-first-handler')
var defaults = require('lodash.defaults')
var uid = require('nano-uid')()

module.exports = function (pkg) {
  var cb = Array.prototype.pop.call(arguments)
  uid.generate(5, efh(cb)(function (id) {
    var pkg = defaults((typeof pkg === 'object' ? pkg : {}), {
      name: id,
      version: '0.0.0',
      devDependencies: {
        'semantic-release': 'file:../../../'
      },
      scripts: {
        prepublish: 'semantic-release pre',
        postpublish: 'semantic-release post'
      },
      publishConfig: {
        registry: 'http://localhost:4873/'
      }
    })

    id = pkg.name
    var cwd = join(__dirname, '../../.tmp/modules', id)

    exec(
      'mkdir ' + cwd + ' && ' +
      'cd ' + cwd + ' && ' +
      'git init && ' +
      'echo \'' + JSON.stringify(pkg, null, 2) + '\' >> package.json && ' +
      'git add . && ' +
      'git config user.email "integration@test" && ' +
      'git config user.name "Integration Test" && ' +
      'git commit -m "initial" && ' +
      'npm install'
    , efh(cb)(function (stdout) {
      cb(null, id, cwd)
    }))
  }))
}

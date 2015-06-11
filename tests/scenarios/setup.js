'use strict'

var join = require('path').join
var readFile = require('fs').readFileSync

var efh = require('error-first-handler')
var nixt = require('nixt')
var test = require('tape')

var createModule = require('../lib/create-module')

module.exports = function () {
  createModule({
    repository: {},
    scripts: {
      postpublish: 'npm run gh-pages'
    }
  }, efh()(function (name, cwd) {
    test('setup', function (t) {
      t.test('setup "package.json"', function (t) {
        t.plan(5)

        nixt()
          .cwd(cwd)
          .exec('git remote add origin git@github.com:user/repo.git')
          .run('../../../bin/semantic-release.js setup')
          .code(0)
          .end(function (err) {
            t.error(err, 'nixt')

            var pkg = JSON.parse(readFile(join(cwd, 'package.json')))

            t.is(pkg.version, '0.0.0-semantically-released', 'version')
            t.is(pkg.repository.url, 'https://github.com/user/repo', 'repo')
            t.is(pkg.scripts.prepublish, 'semantic-release pre', 'pre')
            t.is(pkg.scripts.postpublish, 'npm run gh-pages && semantic-release post', 'post')
          })
      })
    })
  }))
}

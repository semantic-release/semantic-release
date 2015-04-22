'use strict'

var fs = require('fs')
var exec = require('child_process').exec

var nixt = require('nixt')

module.exports = function (t, message, version, code, name, cwd) {
  t.test(name, function (t) {
    t.plan(3)

    nixt()
      .cwd(cwd)
      .env('CI', true)
      .env('npm_config_registry', 'http://127.0.0.1:4873/')
      .exec('git commit --allow-empty -m "' + message + '"')
      .run('npm run prepublish')
      .code(code)
      .stdout(/> semantic-release pre\n\nDetermining new version\n/m)
      .end(function (err) {
        t.error(err, 'nixt')

        var pkg = JSON.parse(fs.readFileSync(cwd + '/package.json'))
        t.is(pkg.version, version, 'version')

        if (code === 1) {
          return t.error(null, 'no publish')
        }

        exec('npm publish --ignore-scripts', {cwd: cwd}, function (err) {
          setTimeout(function () {
            t.error(err, 'publish')
          }, 300)
        })
      })
  })
}

var exec = require('child_process').exec
var join = require('path').join
var writeFileSync = require('fs').writeFileSync

var mkdirp = require('mkdirp')

module.exports = function (name, registry, cb) {
  var cwd = join(__dirname, '../tmp', name)

  mkdirp.sync(cwd)

  writeFileSync(join(cwd, 'package.json'), JSON.stringify({
    name: name,
    repository: {
      url: 'git+https://github.com/semantic-release/test'
    },
    release: {
      verifyConditions: '../../../src/lib/plugin-noop'
    }
  }, null, 2))

  exec(
  'git init && ' +
  'git config user.email "integration@test" && ' +
  'git config user.name "Integration Test" && ' +
  'git add . && ' +
  'git commit -m "chore: root"'
  , {cwd: cwd}, function (err, stdout, stderr) {
    if (err) {
      console.log(stdout, stderr)
      return cb(err)
    }

    cb(null, cwd)
  })
}

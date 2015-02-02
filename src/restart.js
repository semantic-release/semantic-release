'use strict'

var spawn = require('child_process').spawn

module.exports = function () {
  // npm loads package.json data before running the `prepublish` hook
  // changing the version on `prepublish` has no effect
  // see https://github.com/npm/npm/issues/7118
  // to circumvent this behavior we are calling `npm publish` inside `prepublish`
  // the package.json is then loaded again and the correct version will be published

  var child = spawn('npm', ['publish', '--semantic-release-rerun'])

  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)
}

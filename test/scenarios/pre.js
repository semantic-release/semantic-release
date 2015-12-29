var join = require('path').join

var tap = require('tap')
var rimraf = require('rimraf')

var registry = require('../registry')
var testModule = require('../lib/test-module')
var baseScenario = require('../lib/base-scenario')

var tearDown = tap.tearDown
var test = tap.test

test('change version', {bail: process.env.TRAVIS === 'true'}, function (t) {
  t.plan(7)

  registry.start(function (err, stdout, stderr) {
    t.error(err, 'registry started')
    if (err) return t.end()

    testModule('change-version', registry.uri, function (err, cwd) {
      t.error(err, 'test-module created')
      if (err) return t.end()

      t.test('no version', function (tt) {
        tt.plan(1)

        baseScenario(cwd, registry.uri)
          .env('npm_config_loglevel', 'info')
          .run('node ../../../bin/semantic-release.js pre')
          .stderr(/ENOCHANGE/)
          .code(1)
          .end(tt.error)
      })

      t.test('initial version', function (tt) {
        tt.plan(1)

        baseScenario(cwd, registry.uri)
          .exec('git commit -m "feat: initial" --allow-empty')
          .exec('node ../../../bin/semantic-release.js pre')
          .run('npm publish')
          .stdout(/1\.0\.0/)
          .code(0)
          .end(tt.error)
      })

      t.test('patch version', function (tt) {
        tt.plan(1)

        baseScenario(cwd, registry.uri)
          .exec('git commit -m "fix: foo" --allow-empty')
          .exec('node ../../../bin/semantic-release.js pre')
          .run('npm publish')
          .stdout(/1\.0\.1/)
          .code(0)
          .end(tt.error)
      })

      t.test('feature version', function (tt) {
        tt.plan(1)

        baseScenario(cwd, registry.uri)
          .exec('git commit -m "feat: foo" --allow-empty')
          .exec('node ../../../bin/semantic-release.js pre')
          .run('npm publish')
          .code(0)
          .stdout(/1\.1\.0/)
          .end(tt.error)
      })

      t.test('breaking version', function (tt) {
        tt.plan(1)

        baseScenario(cwd, registry.uri)
          .exec('git commit -m "feat: foo\n\n BREAKING CHANGE: bar" --allow-empty')
          .exec('node ../../../bin/semantic-release.js pre')
          .run('npm publish')
          .code(0)
          .stdout(/2\.0\.0/)
          .end(tt.error)
      })
    })
  })
})

tearDown(function () {
  if (process.env.TRAVIS === 'true') return

  function cb (err, stdout, stderr) {
    if (err) console.log(err)
    if (stderr) console.log(stderr)
  }

  rimraf(join(__dirname, '../tmp'), cb)
  registry.stop(cb)
})

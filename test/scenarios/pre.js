const { join } = require('path')

const { test, tearDown } = require('tap')
const rimraf = require('rimraf')

const registry = require('../registry')
const testModule = require('../lib/test-module')
const baseScenario = require('../lib/base-scenario')

test('change version', (t) => {
  t.plan(7)

  registry.start((err) => {
    t.error(err, 'registry started')
    if (err) {
      t.end()
      t.bailout('registry not started')
    }

    testModule('change-version', (err, cwd) => {
      t.error(err, 'test-module created')
      if (err) {
        t.end()
        t.bailout('test-module not created')
      }

      t.test('no version', (tt) => {
        tt.plan(1)

        baseScenario(cwd, registry.uri)
          .env('npm_config_loglevel', 'info')
          .run('node ../../../bin/semantic-release.js pre')
          .stderr(/ENOCHANGE/)
          .code(1)
          .end(tt.error)
      })

      t.test('initial version', (tt) => {
        tt.plan(1)

        baseScenario(cwd, registry.uri)
          .exec('git commit -m "feat: initial" --allow-empty')
          .exec('node ../../../bin/semantic-release.js pre')
          .run('npm publish')
          .stdout(/1\.0\.0/)
          .code(0)
          .end(tt.error)
      })

      t.test('patch version', (tt) => {
        tt.plan(1)

        baseScenario(cwd, registry.uri)
          .exec('git commit -m "fix: foo" --allow-empty')
          .exec('node ../../../bin/semantic-release.js pre')
          .run('npm publish')
          .stdout(/1\.0\.1/)
          .code(0)
          .end(tt.error)
      })

      t.test('feature version', (tt) => {
        tt.plan(1)

        baseScenario(cwd, registry.uri)
          .exec('git commit -m "feat: foo" --allow-empty')
          .exec('node ../../../bin/semantic-release.js pre')
          .run('npm publish')
          .code(0)
          .stdout(/1\.1\.0/)
          .end(tt.error)
      })

      t.test('breaking version', (tt) => {
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

tearDown(() => {
  function cb (err, stdout, stderr) {
    if (err) console.log(err)
    if (stdout) console.log(stdout)
    if (stderr) console.log(stderr)
  }

  rimraf(join(__dirname, '../tmp'), cb)
  registry.stop(cb)
})

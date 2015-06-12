const path = require('path')

const efh = require('error-first-handler')
const nixt = require('nixt')
const test = require('tap').test

const createModule = require('../lib/create-module')

test('custom-verification', (t) => {
  createModule({
    release: {
      verification: path.join(__dirname, '../lib/custom-verification')
    }
  }, efh()((name, cwd) => {
    t.test('even commit count', (t) => {
      t.plan(1)
      nixt()
        .cwd(cwd)
        .env('CI', true)
        .env('npm_config_registry', 'http://127.0.0.1:4873/')
        .exec('git commit --allow-empty -m "feat: commit"')
        .run('npm run prepublish')
        .code(0)
        .end((err) => t.error(err, 'nixt'))
    })

    t.test('odd commit count', (t) => {
      t.plan(1)
      nixt()
        .cwd(cwd)
        .env('CI', true)
        .env('npm_config_registry', 'http://127.0.0.1:4873/')
        .exec('git commit --allow-empty -m "feat: commit"')
        .run('npm run prepublish')
        .code(1)
        .stdout(/Verification failed/)
        .end((err) => t.error(err, 'nixt'))
    })
  }))
})

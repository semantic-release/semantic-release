const efh = require('error-first-handler')
const nixt = require('nixt')
const test = require('tap').test

const createModule = require('../lib/create-module')

test('verify', (t) => {
  createModule({
    repository: {},
    scripts: {
      prepublish: '../../../bin/semantic-release.js pre --no-token'
    }
  }, efh()((name, cwd) => {
    t.test('verify package and options before publishing', (t) => {
      t.plan(1)
      nixt()
        .cwd(cwd)
        .env('CI', true)
        .run('npm publish')
        .stderr(new RegExp(
`You must define a GitHub token\.
You must define your GitHub "repository" inside the "package.json"\.
You must define your "scripts" inside the "package.json"\.`
          , 'm'
        ))
        .code(1)
        .end((err) => t.error(err, 'nixt'))
    })
  }))

  createModule({
    version: '1.0.0-semantically-released'
  }, efh()((name, cwd) => {
    t.test('not publishing placeholder versions', (t) => {
      t.plan(1)

      nixt()
        .cwd(cwd)
        .env('CI', true)
        .run('npm publish --semantic-release-rerun')
        .code(1)
        .end((err) => t.error(err, 'nixt'))
    })
  }))
})

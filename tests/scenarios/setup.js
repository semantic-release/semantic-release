const join = require('path').join
const readFile = require('fs').readFileSync

const efh = require('error-first-handler')
const nixt = require('nixt')
const test = require('tap').test

const createModule = require('../lib/create-module')

test('setup', (t) => {
  createModule({
    repository: {},
    scripts: {
      postpublish: 'npm run gh-pages'
    }
  }, efh()((name, cwd) => {
    t.test('setup "package.json"', (t) => {
      t.plan(5)

      nixt()
        .cwd(cwd)
        .exec('git remote add origin git@github.com:user/repo.git')
        .run('../../../bin/semantic-release.js setup')
        .code(0)
        .end((err) => {
          t.error(err, 'nixt')

          const pkg = JSON.parse(readFile(join(cwd, 'package.json')))

          t.is(pkg.version, '0.0.0-semantically-released', 'version')
          t.is(pkg.repository.url, 'https://github.com/user/repo', 'repo')
          t.is(pkg.scripts.prepublish, 'semantic-release pre', 'pre')
          t.is(pkg.scripts.postpublish, 'npm run gh-pages && semantic-release post', 'post')
        })
    })
  }))
})

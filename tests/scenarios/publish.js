const efh = require('error-first-handler')
const nixt = require('nixt')
const test = require('tap').test

const createModule = require('../lib/create-module')

test('publish', (t) => {
  publishTest(t, 'npm publish', 'pre and post hooks work as a part of publish')
  publishTest(t, 'npm pub', 'pre and post hooks work as a part of publish with abbrevd command')

  function publishTest (t, command, testname, last) {
    createModule({
      repository: {
        type: 'git',
        url: 'http://github.com/user/repo'
      }
    }, efh()((name, cwd) => {
      t.test(testname, (t) => {
        t.plan(1)

        nixt()
          .cwd(cwd)
          .env('CI', true)
          .env('GH_URL', 'http://127.0.0.1:4343/')
          .env('GH_TOKEN', '***')
          .exec('git commit --allow-empty -m "feat: super"')
          .run(command)
          .code(1)
          .stdout(/Everything is alright/)
          .end((err) => t.error(err, 'nixt'))
      })
    }))
  }
})

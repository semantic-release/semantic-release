const exec = require('child_process').exec
const join = require('path').join

const efh = require('error-first-handler')
const defaults = require('lodash.defaults')
const uid = require('nano-uid')()

module.exports = function (input) {
  const cb = Array.prototype.pop.call(arguments)
  uid.generate(5, efh(cb)((id) => {
    const pkg = defaults((typeof input === 'object' ? input : {}), {
      name: id,
      version: '0.0.0',
      scripts: {
        prepublish: '../../../bin/semantic-release.js pre',
        postpublish: '../../../bin/semantic-release.js post'
      },
      publishConfig: {
        registry: 'http://localhost:4873/'
      }
    })

    id = pkg.name
    const cwd = join(__dirname, '../../.tmp/modules', id)

    exec(
      `mkdir ${cwd} &&
      cd ${cwd} &&
      git init &&
      echo '${JSON.stringify(pkg, null, 2)}' >> package.json &&
      git add . &&
      git config user.email "integration@test" &&
      git config user.name "Integration Test" &&
      git commit -m "initial"`
    , efh(cb)((stdout) => {
      cb(null, id, cwd)
    }))
  }))
}

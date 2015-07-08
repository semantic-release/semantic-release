const { exec } = require('child_process')
const { join } = require('path')
const { writeFileSync } = require('fs')

const mkdirp = require('mkdirp')

module.exports = function (name, cb) {
  const cwd = join(__dirname, '../tmp', name)

  mkdirp.sync(cwd)

  writeFileSync(join(cwd, '.npmrc'), `
//localhost:1337/registry/_design/app/_rewrite/:username=integration
//localhost:1337/registry/_design/app/_rewrite/:email=integration@test.com`, null, 2)

  writeFileSync(join(cwd, 'package.json'), JSON.stringify({
    name,
    repository: {
      url: 'git+https://github.com/semantic-release/test'
    },
    _npmUser: {
      name: 'integration',
      email: 'integration@test.com'
    },
    maintainers: [{
      name: 'integration',
      email: 'integration@test.com'
    }]
  }, null, 2))

  exec(`
    git init &&
    git config user.email "integration@test" &&
    git config user.name "Integration Test" &&
    git add . &&
    git commit -m "chore: root"`
  , {cwd}, (err, stdout, stderr) => {
    if (err) {
      console.log(stdout, stderr)
      return cb(err)
    }

    cb(null, cwd)
  })
}

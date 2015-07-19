const { exec } = require('child_process')
const { join } = require('path')

const opts = {
  cwd: join(__dirname, '../../test/registry')
}

module.exports = {
  start: exec.bind(null, './start.sh', opts),
  stop: exec.bind(null, './stop.sh', opts),
  uri: 'http://localhost:15986/registry/_design/app/_rewrite/'
}

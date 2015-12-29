var exec = require('child_process').exec

var opts = {
  cwd: __dirname
}

module.exports = {
  start: exec.bind(null, './start.sh', opts),
  stop: exec.bind(null, './stop.sh', opts),
  uri: 'http://localhost:' + (process.env.TRAVIS === 'true' ? 5984 : 15986) + '/registry/_design/app/_rewrite/'
}

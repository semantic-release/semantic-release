const { exec } = require('child_process')

const { efh } = require('./error')

module.exports = function (from, cb) {
  const range = (from ? from + '..' : '') + 'HEAD'
  exec(
    `git log -E --format=%H==SPLIT==%B==END== ${range}`,
    efh(cb)((stdout) => {
      cb(null, String(stdout).split('==END==\n')

      .filter((raw) => !!raw.trim())

      .map((raw) => {
        const data = raw.split('==SPLIT==')
        return {
          hash: data[0],
          message: data[1]
        }
      }))
    })
  )
}

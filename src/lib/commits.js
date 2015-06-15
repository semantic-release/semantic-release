const { exec } = require('child_process')

module.exports = function (results, cb) {
  const from = results.lastRelease.gitHead
  const range = (from ? from + '..' : '') + 'HEAD'

  exec(
    `git log -E --format=%H==SPLIT==%B==END== ${range}`,
    (err, stdout) => {
      if (err) return cb(err)

      cb(null, String(stdout).split('==END==\n')

      .filter((raw) => !!raw.trim())

      .map((raw) => {
        const data = raw.split('==SPLIT==')
        return {
          hash: data[0],
          message: data[1]
        }
      }))
    }
  )
}

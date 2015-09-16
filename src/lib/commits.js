const { exec } = require('child_process')

const log = require('npmlog')

const SemanticReleaseError = require('@semantic-release/error')

module.exports = function ({lastRelease, options}, cb) {
  const branch = options.branch
  const from = lastRelease.gitHead
  const range = (from ? from + '..' : '') + 'HEAD'

  if (!from) return extract()

  exec(`git branch --contains ${from}`, (err, stdout) => {
    let inHistory = false
    let branches

    if (!err && stdout) {
      branches = stdout.split('\n')
      .map((result) => {
        if (branch === result.replace('*', '').trim()) {
          inHistory = true
          return null
        }
        return result.trim()
      })
      .filter(branch => !!branch)
    }

    if (!inHistory) {
      log.error('commits',
`The commit the last release of this package was derived from is not in the direct history of the "${branch}" branch.
This means semantic-release can not extract the commits between now and then.
This is usually caused by force pushing, releasing from an unrelated branch, or using an already existing package name.
You can recover from this error by publishing manually or restoring the commit "${from}".` + (branches && branches.length ?
        `\nHere is a list of branches that still contain the commit in question: \n * ${branches.join('\n * ')}` :
        ''
      ))
      return cb(new SemanticReleaseError('Commit not in history', 'ENOTINHISTORY'))
    }

    extract()
  })

  function extract () {
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
}

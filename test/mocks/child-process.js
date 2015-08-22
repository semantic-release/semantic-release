const rawCommits = [
  'hash-one==SPLIT==commit-one==END==\n',
  'hash-two==SPLIT==commit-two==END==\n'
]

module.exports = {
  exec: (command, cb) => {
    if (/contains/.test(command)) {
      return cb(null, `whatever\nmaster\n`)
    }

    cb(
      null,
      /\.\.HEAD/.test(command) ?
        rawCommits[0] :
        rawCommits.join()
    )
  },
  '@noCallThru': true
}

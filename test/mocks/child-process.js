const rawCommits = [
  'hash-one==SPLIT==commit-one==END==\n',
  'hash-two==SPLIT==commit-two==END==\n'
]

module.exports = {
  exec: function (command, options, cb) {
    if (typeof cb === 'undefined' && typeof options === 'function') {
      cb = options
    }
    if (/contains/.test(command)) {
      if (/notinhistory/.test(command)) return cb(new Error())
      return cb(null, 'whatever\nmaster\n')
    }

    cb(
      null,
      /\.\.HEAD/.test(command)
        ? rawCommits[0]
        : rawCommits.join()
    )
  },
  '@noCallThru': true
}

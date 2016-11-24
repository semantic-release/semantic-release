var mockSpawn = require('mock-spawn')()
mockSpawn.setStrategy(function (command, args, opts) {
  return function (cb) {
    this.stdout.write(
      /\.\.HEAD/.test(args.join(' '))
        ? rawCommits[0]
        : rawCommits.join()
    )
    cb(0)
  }
})

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
  },
  spawn: mockSpawn,
  '@noCallThru': true
}

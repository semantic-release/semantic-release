var childProcess = require('child_process')

var log = require('npmlog')

var SemanticReleaseError = require('@semantic-release/error')

module.exports = function (config, cb) {
  var lastRelease = config.lastRelease
  var options = config.options
  var branch = options.branch
  var from = lastRelease.gitHead
  if (!from) {
    from = config.lastRelease.version ? 'v' + config.lastRelease.version : false
    var msg = 'NPM registry does not contain "gitHead" in latest package version data. It\'s probably because ' +
      'the publish happened outside of repository folder.'
    if (from) {
      msg = msg + ' Will try last version\'s Git tag instead: "' + from + '".'
    } else {
      msg = msg + ' Using all the commits history to HEAD then.'
    }
    log.warn(msg)
  }
  var range = (from ? from + '..' : '') + 'HEAD'

  if (!from) return extract()

  childProcess.exec('git branch --no-color --contains ' + from, function (err, stdout) {
    var inHistory = false
    var branches

    if (!err && stdout) {
      branches = stdout.split('\n')
      .map(function (result) {
        if (branch === result.replace('*', '').trim()) {
          inHistory = true
          return null
        }
        return result.trim()
      })
      .filter(function (branch) {
        return !!branch
      })
    }

    if (!inHistory) {
      log.error('commits',
        'The commit the last release of this package was derived from is not in the direct history of the "' + branch + '" branch.\n' +
        'This means semantic-release can not extract the commits between now and then.\n' +
        'This is usually caused by force pushing, releasing from an unrelated branch, or using an already existing package name.\n' +
        'You can recover from this error by publishing manually or restoring the commit "' + from + '".' + (branches && branches.length
        ? '\nHere is a list of branches that still contain the commit in question: \n * ' + branches.join('\n * ')
        : ''
      ))
      return cb(new SemanticReleaseError('Commit not in history', 'ENOTINHISTORY'))
    }

    extract()
  })

  function extract () {
    var child = childProcess.spawn('git', ['log', '-E', '--format=%H==SPLIT==%B==END==', range])
    var stdout = ''
    var err = ''

    child.stdout.on('data', function (data) {
      stdout += data
    })

    child.stderr.on('data', function (data) {
      err += data
    })

    child.on('close', function (code) {
      if (err || code) return cb(err)

      cb(null, String(stdout).split('==END==\n')
        .filter(function (raw) {
          return !!raw.trim()
        })
        .map(function (raw) {
          var data = raw.split('==SPLIT==')
          return {
            hash: data[0],
            message: data[1]
          }
        })
      )
    })
  }
}

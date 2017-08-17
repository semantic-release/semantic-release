var log = require('npmlog')
var fs = require('fs')
var _ = require('lodash')

module.exports = function (config, options, originalPkg, npm) {
  require('../pre')(config, function (err, release) {
    if (err) {
      log.error('pre', 'Failed to determine new version.')

      var args = ['pre', (err.code ? err.code + ' ' : '') + err.message]
      if (err.stack) args.push(err.stack)
      log.error.apply(log, args)
      process.exit(1)
    }

    var message = 'Determined version ' + release.version + ' as "' + npm.tag + '".'

    log.verbose('pre', message)

    if (options.debug) {
      log.error('pre', message + ' Not publishing in debug mode.', release)
      process.exit(1)
    }

    try {
      var shrinkwrap = JSON.parse(fs.readFileSync('./npm-shrinkwrap.json'))
      shrinkwrap.version = release.version
      fs.writeFileSync('./npm-shrinkwrap.json', JSON.stringify(shrinkwrap, null, 2))
      log.verbose('pre', 'Wrote version ' + release.version + 'to npm-shrinkwrap.json.')
    } catch (e) {
      log.silly('pre', 'Couldn\'t find npm-shrinkwrap.json.')
    }

    fs.writeFileSync('./package.json', JSON.stringify(_.assign(originalPkg, {
      version: release.version
    }), null, 2))

    log.verbose('pre', 'Wrote version ' + release.version + ' to package.json.')
  })
}

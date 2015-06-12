const abbrev = require('abbrev')
const efh = require('./lib/error').standard

exports.pre = function (argv, npmArgv, plugins) {
  // see src/restart.js
  if (npmArgv['semantic-release-rerun']) {
    if (!/semantically-released/.test(process.env.npm_package_version)) process.exit(0)

    console.log(
`There is something wrong with your setup, as a placeholder version is about to be released.
Please verify that your setup is correct.
If you think this is a problem with semantic-release please open an issue.`
    )
    process.exit(1)
  }
  // the `prepublish` hook is also executed when the package is installed
  // in this case we abort the command and do nothing.
  if (
    isAbbrev(npmArgv, 'install') ||
    isAbbrev(npmArgv, 'link') ||
    isAbbrev(npmArgv, 'pack')
  ) process.exit(0)

  if (argv.debug) console.log('This is a dry run')

  console.log('Determining new version')

  const publish = isAbbrev(npmArgv, 'publish')

  // require a correct setup during publish
  if (publish && !argv.debug && !require('./verify')(argv)) process.exit(1)

  require('./pre')(argv, plugins, efh((result) => {
    if (!result) {
      console.log('Nothing changed. Not publishing.')
      process.exit(1)
    }

    console.log('Publishing v' + result)
    if (!publish) process.exit(0)

    if (argv.debug) process.exit(1)

    require('./restart')(efh(() => process.exit(1)))
  }))
}

exports.post = function (argv, npmArgv, plugins) {
  require('./post')(argv, plugins, efh(function () {
    // see src/restart.js
    if (npmArgv['semantic-release-rerun']) {
      console.log('Everything is alright :) npm will now print an error message that you can safely ignore.')
    }
  }))
}

exports.setup = function () {
  require('./setup')()
  console.log('"package.json" is set up properly. Now configure your CI server.')
  console.log('https://github.com/boennemann/semantic-release#ci-server')
}

function isAbbrev (argv, command) {
  return argv._.some(Object.prototype.hasOwnProperty.bind(abbrev(command)))
}

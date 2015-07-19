const nixt = require('nixt')

module.exports = function (cwd, uri) {
  return nixt()
    .cwd(cwd)
    .env('NPM_OLD_TOKEN', 'aW50ZWdyYXRpb246c3VjaHNlY3VyZQ==')
		.env('NPM_EMAIL', 'integration@test.com')
    .env('GH_TOKEN', 'ghtoken')
    .env('CI', 'true')
    .env('TRAVIS', 'true')
    .env('TRAVIS_BRANCH', 'master')
    .env('npm_config_registry', uri)
    .clone()
}

'use strict'

var async = require('async')
var npmconf = require('npmconf')
var request = require('request')

module.exports = function (pkgName, cb) {
  var registry = process.env.npm_config_registry
  async.waterfall([
    npmconf.load,
    function (conf, callback) {
      var cred = conf.getCredentialsByURI(registry)
      callback(null, {
        url: registry + pkgName.replace(/\//g, '%2F'),
        headers: {
          'Authorization': cred.token ? 'Bearer ' + cred.token : null
        }
      })
    },
    request,
    function (response, body, callback) {
      var res = {
        version: null,
        gitHead: null,
        pkg: null
      }

      if (response.statusCode === 404 || !body) return callback(null, res)

      var pkg = JSON.parse(body)

      if (pkg.error) return callback(pkg.error)

      res.version = pkg['dist-tags'].latest
      res.gitHead = pkg.versions[res.version].gitHead
      res.pkg = pkg

      callback(null, res)
    }
  ], cb)
}

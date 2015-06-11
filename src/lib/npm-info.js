import async from 'async'
import npmconf from 'npmconf'
import request from 'request'

export default function (pkgName, cb) {
  const registry = process.env.npm_config_registry

  async.waterfall([
    npmconf.load,
    (conf, callback) => {
      const cred = conf.getCredentialsByURI(registry)
      const reqopts = {
        url: registry + pkgName.replace(/\//g, '%2F'),
        headers: {}
      }

      if (cred.token) {
        reqopts.headers.Authorization = `Bearer ${cred.token}`
      } else if (cred.auth) {
        reqopts.headers.Authorization = `Basic ${cred.auth}`
      }

      callback(null, reqopts)
    },
    request,
    (response, body, callback) => {
      let res = {
        version: null,
        gitHead: null,
        pkg: null
      }

      if (response.statusCode === 404 || !body) return callback(null, res)

      const pkg = JSON.parse(body)

      if (pkg.error) return callback(pkg.error)

      res.version = pkg['dist-tags'].latest
      res.gitHead = pkg.versions[res.version].gitHead
      res.pkg = pkg

      callback(null, res)
    }
  ], cb)
}

const npmlog = require('npmlog')
const RegClient = require('npm-registry-client')

module.exports = function (pkg, npmConfig, cb) {
  npmlog.level = npmConfig.loglevel || 'error'
  const client = new RegClient({log: npmlog})

  client.get(`${npmConfig.registry}${pkg.name}`, {
    auth: npmConfig.auth
  }, (err, data) => {
    if (err && err.statusCode === 404) return cb(null, {})
    if (err) return cb(err)

    const version = data['dist-tags'].latest

    cb(null, {
      version,
      gitHead: data.versions[version].gitHead
    })
  })
}

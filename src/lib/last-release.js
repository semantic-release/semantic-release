const SemanticReleaseError = require('@semantic-release/error')

const npmlog = require('npmlog')
const RegClient = require('npm-registry-client')

module.exports = function ({pkg, npm}, cb) {
  npmlog.level = npm.loglevel || 'error'
  const client = new RegClient({log: npmlog})

  client.get(`${npm.registry}${pkg.name}`, {
    auth: npm.auth
  }, (err, data) => {
    if (err && err.statusCode === 404) return cb(null, {})
    if (err) return cb(err)

    const version = data['dist-tags'][npm.tag]

    if (!version) return cb(new SemanticReleaseError(`There is no release with the dist-tag "${npm.tag}" yet. Tag a version first.`, 'ENODISTTAG'))

    cb(null, {
      version,
      gitHead: data.versions[version].gitHead,
      tag: npm.tag
    })
  })
}

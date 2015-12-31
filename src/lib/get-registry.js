module.exports = function (pkg, conf) {
  if (pkg.publishConfig && pkg.publishConfig.registry) return pkg.publishConfig.registry

  if (pkg.name[0] !== '@') return conf.get('registry') || 'https://registry.npmjs.org/'

  var scope = pkg.name.split('/')[0]
  var scopedRegistry = conf.get(scope + '/registry')

  if (scopedRegistry) return scopedRegistry

  return conf.get('registry') || 'https://registry.npmjs.org/'
}

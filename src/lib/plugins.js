let exports = module.exports = function (source) {
  return {
    analyze: exports.normalize(source.analyze, '@semantic-release/commit-analyzer'),
    generateNotes: exports.normalize(source.analyze, '@semantic-release/release-notes-generator'),
    verify: exports.normalize(source.verify, './plugin-noop')
  }
}

exports.normalize = function (plugin, fallback) {
  if (typeof plugin === 'string') return require(plugin).bind(null, {})

  if (plugin && (typeof plugin.path === 'string')) {
    return require(plugin.path).bind(null, plugin)
  }

  return require(fallback).bind(null, plugin)
}

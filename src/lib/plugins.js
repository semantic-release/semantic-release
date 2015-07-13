let exports = module.exports = function (source) {
  return {
    analyzeCommits: exports.normalize(source.analyzeCommits, '@semantic-release/commit-analyzer'),
    generateNotes: exports.normalize(source.generateNotes, '@semantic-release/release-notes-generator'),
    verifyRelease: exports.normalize(source.verifyRelease, './plugin-noop')
  }
}

exports.normalize = function (plugin, fallback) {
  if (typeof plugin === 'string') return require(plugin).bind(null, {})

  if (plugin && (typeof plugin.path === 'string')) {
    return require(plugin.path).bind(null, plugin)
  }

  return require(fallback).bind(null, plugin)
}

const relative = require('require-relative')

let exports = module.exports = function (source) {
  return {
    analyzeCommits: exports.normalize(source.analyzeCommits, '@semantic-release/commit-analyzer'),
    generateNotes: exports.normalize(source.generateNotes, '@semantic-release/release-notes-generator'),
    verifyConditions: exports.normalize(source.verifyConditions, '@semantic-release/condition-travis'),
    verifyRelease: exports.normalize(source.verifyRelease, './plugin-noop')
  }
}

exports.normalize = function (plugin, fallback) {
  if (typeof plugin === 'string') return relative(plugin).bind(null, {})

  if (plugin && (typeof plugin.path === 'string')) {
    return relative(plugin.path).bind(null, plugin)
  }

  return require(fallback).bind(null, plugin)
}

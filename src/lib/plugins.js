const relative = require('require-relative')

let exports = module.exports = function (options) {
  return {
    analyzeCommits: exports.normalize(options.analyzeCommits, '@semantic-release/commit-analyzer'),
    generateNotes: exports.normalize(options.generateNotes, '@semantic-release/release-notes-generator'),
    verifyConditions: exports.normalize(options.verifyConditions, '@semantic-release/condition-travis'),
    verifyRelease: exports.normalize(options.verifyRelease, './plugin-noop')
  }
}

exports.normalize = function (pluginConfig, fallback) {
  if (typeof pluginConfig === 'string') return relative(pluginConfig).bind(null, {})

  if (pluginConfig && (typeof pluginConfig.path === 'string')) {
    return relative(pluginConfig.path).bind(null, pluginConfig)
  }

  return require(fallback).bind(null, pluginConfig)
}

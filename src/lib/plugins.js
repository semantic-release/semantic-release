var relative = require('require-relative')
var series = require('run-series')

var exports = module.exports = function (options) {
  var plugins = {
    analyzeCommits: exports.normalize(options.analyzeCommits, '@semantic-release/commit-analyzer'),
    generateNotes: exports.normalize(options.generateNotes, '@semantic-release/release-notes-generator'),
    getLastRelease: exports.normalize(options.getLastRelease, '@semantic-release/last-release-npm')
  }

  ;['verifyConditions', 'verifyRelease'].forEach(function (plugin) {
    if (!Array.isArray(options[plugin])) {
      plugins[plugin] = exports.normalize(
        options[plugin],
        plugin === 'verifyConditions'
          ? '@semantic-release/condition-travis'
          : './plugin-noop'
      )
      return
    }

    plugins[plugin] = function (pluginOptions, cb) {
      var tasks = options[plugin].map(function (step) {
        return exports.normalize(step, './plugin-noop').bind(null, pluginOptions)
      })

      series(tasks, cb)
    }
  })

  return plugins
}

exports.normalize = function (pluginConfig, fallback) {
  if (typeof pluginConfig === 'string') return relative(pluginConfig).bind(null, {})

  if (pluginConfig && (typeof pluginConfig.path === 'string')) {
    return relative(pluginConfig.path).bind(null, pluginConfig)
  }

  return require(fallback).bind(null, pluginConfig)
}

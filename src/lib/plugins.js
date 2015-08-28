const relative = require('require-relative')
const series = require('run-series')

let exports = module.exports = function (options) {
  var plugins = {
    analyzeCommits: exports.normalizeArray(options.analyzeCommits, '@semantic-release/commit-analyzer'),
    generateNotes: exports.normalizeArray(options.generateNotes, '@semantic-release/release-notes-generator'),
    getLastRelease: exports.normalizeArray(options.getLastRelease, '@semantic-release/last-release-npm'),
    verifyConditions: exports.normalizeArray(options.verifyConditions, ['./plugin-verify-github', '@semantic-release/condition-travis']),
    verifyRelease: exports.normalizeArray(options.verifyRelease, exports.noopPlugin)
  }
  return plugins
}

function loadPlugin (name) {
  try {
    return require(name)
  } catch(err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return relative(name)
    } else {
      throw err
    }
  }
}

exports.noopPlugin = './plugin-noop'

exports.normalizeArray = function (pluginConfig, fallback) {
  if (Array.isArray(pluginConfig)) {

    return function (pluginOptions, cb) {
      var tasks = pluginConfig.map((step) => {
        return exports.normalize(step, exports.noopPlugin).bind(null, pluginConfig)
      })

      series(tasks, cb)
    }
  } else if (typeof pluginConfig === 'string' || (pluginConfig && (typeof pluginConfig.path === 'string'))) {
    return exports.normalize(pluginConfig, fallback)
  }

  return exports.normalizeArray(fallback, exports.noopPlugin)
}

exports.normalize = function (pluginConfig, fallback) {
  if (typeof pluginConfig === 'string') return loadPlugin(pluginConfig).bind(null, {})

  if (pluginConfig && (typeof pluginConfig.path === 'string')) {
    return loadPlugin(pluginConfig.path).bind(null, pluginConfig)
  }

  return loadPlugin(fallback).bind(null, pluginConfig)
}

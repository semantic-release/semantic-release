const {promisify} = require('util');
const relative = require('require-relative');
const pSeries = require('p-series');
const logger = require('./logger');

module.exports = options => {
  const plugins = {
    analyzeCommits: normalize(options.analyzeCommits, '@semantic-release/commit-analyzer'),
    generateNotes: normalize(options.generateNotes, '@semantic-release/release-notes-generator'),
    getLastRelease: normalize(options.getLastRelease, '@semantic-release/last-release-npm'),
  };
  ['verifyConditions', 'verifyRelease'].forEach(plugin => {
    if (!Array.isArray(options[plugin])) {
      plugins[plugin] = normalize(
        options[plugin],
        plugin === 'verifyConditions' ? '@semantic-release/condition-travis' : './plugin-noop'
      );
    } else {
      plugins[plugin] = async pluginOptions => {
        return pSeries(
          options[plugin].map(step => {
            return () => normalize(step, './plugin-noop')(pluginOptions);
          })
        );
      };
    }
  });

  return plugins;
};

const normalize = (pluginConfig, fallback) => {
  if (typeof pluginConfig === 'string') {
    logger.log('Load plugin %s', pluginConfig);
    return promisify(relative(pluginConfig).bind(null, {}));
  }

  if (pluginConfig && typeof pluginConfig.path === 'string') {
    logger.log('Load plugin %s', pluginConfig.path);
    return promisify(relative(pluginConfig.path).bind(null, pluginConfig));
  }
  return promisify(require(fallback).bind(null, pluginConfig || {}));
};

module.exports.normalize = normalize;

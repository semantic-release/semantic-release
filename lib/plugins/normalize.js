const {dirname} = require('path');
const {isString, isPlainObject, isFunction, noop, cloneDeep} = require('lodash');
const resolveFrom = require('resolve-from');
const getError = require('../get-error');
const {extractErrors} = require('../utils');
const PLUGINS_DEFINITIONS = require('../definitions/plugins');

module.exports = (pluginType, pluginsPath, globalOpts, pluginOpts, logger) => {
  if (!pluginOpts) {
    return noop;
  }

  const {path, ...config} = isString(pluginOpts) || isFunction(pluginOpts) ? {path: pluginOpts} : pluginOpts;
  const pluginName = isFunction(path) ? `[Function: ${path.name}]` : path;

  if (!isFunction(pluginOpts)) {
    if (pluginsPath[path]) {
      logger.log('Load plugin %s from %s in shareable config %s', pluginType, path, pluginsPath[path]);
    } else {
      logger.log('Load plugin %s from %s', pluginType, path);
    }
  }

  const basePath = pluginsPath[path]
    ? dirname(resolveFrom.silent(__dirname, pluginsPath[path]) || resolveFrom(process.cwd(), pluginsPath[path]))
    : __dirname;
  const plugin = isFunction(path)
    ? path
    : require(resolveFrom.silent(basePath, path) || resolveFrom(process.cwd(), path));

  let func;
  if (isFunction(plugin)) {
    func = plugin.bind(null, cloneDeep({...globalOpts, ...config}));
  } else if (isPlainObject(plugin) && plugin[pluginType] && isFunction(plugin[pluginType])) {
    func = plugin[pluginType].bind(null, cloneDeep({...globalOpts, ...config}));
  } else {
    throw getError('EPLUGIN', {pluginType, pluginName});
  }

  return Object.defineProperty(
    async input => {
      const definition = PLUGINS_DEFINITIONS[pluginType];
      try {
        const result = await func(cloneDeep(input));
        if (definition && definition.output && !definition.output.validator(result)) {
          throw getError(PLUGINS_DEFINITIONS[pluginType].output.error, {result, pluginName});
        }
        return result;
      } catch (err) {
        extractErrors(err).forEach(err => Object.assign(err, {pluginName}));
        throw err;
      }
    },
    'pluginName',
    {value: pluginName, writable: false, enumerable: true}
  );
};

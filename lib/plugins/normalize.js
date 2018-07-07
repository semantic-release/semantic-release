const {dirname} = require('path');
const {isString, isPlainObject, isFunction, noop, cloneDeep} = require('lodash');
const resolveFrom = require('resolve-from');
const getError = require('../get-error');
const {extractErrors} = require('../utils');
const PLUGINS_DEFINITIONS = require('../definitions/plugins');

/* eslint max-params: ["error", 5] */

module.exports = (type, pluginsPath, globalOpts, pluginOpts, logger) => {
  if (!pluginOpts) {
    return noop;
  }

  const {path, ...config} = isString(pluginOpts) || isFunction(pluginOpts) ? {path: pluginOpts} : pluginOpts;
  const pluginName = isFunction(path) ? `[Function: ${path.name}]` : path;

  if (!isFunction(pluginOpts)) {
    if (pluginsPath[path]) {
      logger.log('Load plugin "%s" from %s in shareable config %s', type, path, pluginsPath[path]);
    } else {
      logger.log('Load plugin "%s" from %s', type, path);
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
  } else if (isPlainObject(plugin) && plugin[type] && isFunction(plugin[type])) {
    func = plugin[type].bind(null, cloneDeep({...globalOpts, ...config}));
  } else {
    throw getError('EPLUGIN', {type, pluginName});
  }

  const validator = async input => {
    const {outputValidator} = PLUGINS_DEFINITIONS[type] || {};
    try {
      const result = await func(cloneDeep(input));
      if (outputValidator && !outputValidator(result)) {
        throw getError(`E${type.toUpperCase()}OUTPUT`, {result, pluginName});
      }
      return result;
    } catch (err) {
      extractErrors(err).forEach(err => Object.assign(err, {pluginName}));
      throw err;
    }
  };

  Reflect.defineProperty(validator, 'pluginName', {value: pluginName, writable: false, enumerable: true});
  return validator;
};

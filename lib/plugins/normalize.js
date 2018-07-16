const {dirname} = require('path');
const {isString, isPlainObject, isFunction, noop, cloneDeep} = require('lodash');
const resolveFrom = require('resolve-from');
const getError = require('../get-error');
const {extractErrors} = require('../utils');
const PLUGINS_DEFINITIONS = require('../definitions/plugins');

module.exports = ({cwd, options, logger}, type, pluginOpt, pluginsPath) => {
  if (!pluginOpt) {
    return noop;
  }

  const {path, ...config} = isString(pluginOpt) || isFunction(pluginOpt) ? {path: pluginOpt} : pluginOpt;
  const pluginName = isFunction(path) ? `[Function: ${path.name}]` : path;

  if (!isFunction(pluginOpt)) {
    if (pluginsPath[path]) {
      logger.log('Load plugin "%s" from %s in shareable config %s', type, path, pluginsPath[path]);
    } else {
      logger.log('Load plugin "%s" from %s', type, path);
    }
  }

  const basePath = pluginsPath[path]
    ? dirname(resolveFrom.silent(__dirname, pluginsPath[path]) || resolveFrom(cwd, pluginsPath[path]))
    : __dirname;
  const plugin = isFunction(path) ? path : require(resolveFrom.silent(basePath, path) || resolveFrom(cwd, path));

  let func;
  if (isFunction(plugin)) {
    func = plugin.bind(null, cloneDeep({...options, ...config}));
  } else if (isPlainObject(plugin) && plugin[type] && isFunction(plugin[type])) {
    func = plugin[type].bind(null, cloneDeep({...options, ...config}));
  } else {
    throw getError('EPLUGIN', {type, pluginName});
  }

  const validator = async input => {
    const {outputValidator} = PLUGINS_DEFINITIONS[type] || {};
    try {
      logger.log('Call plugin "%s"', type);
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

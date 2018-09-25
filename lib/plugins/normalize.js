const {isPlainObject, isFunction, noop, cloneDeep, omit} = require('lodash');
const getError = require('../get-error');
const {extractErrors} = require('../utils');
const PLUGINS_DEFINITIONS = require('../definitions/plugins');
const {loadPlugin, parseConfig} = require('./utils');

module.exports = (context, type, pluginOpt, pluginsPath) => {
  const {stdout, stderr, options, logger} = context;
  if (!pluginOpt) {
    return noop;
  }

  const [path, config] = parseConfig(pluginOpt);
  const pluginName = isFunction(path) ? `[Function: ${path.name}]` : path;
  const plugin = loadPlugin(context, path, pluginsPath);

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
      logger.log(`Start step "${type}" of plugin "${pluginName}"`);
      const result = await func({
        ...cloneDeep(omit(input, ['stdout', 'stderr', 'logger'])),
        stdout,
        stderr,
        logger: logger.scope(logger.scopeName, pluginName),
      });
      if (outputValidator && !outputValidator(result)) {
        throw getError(`E${type.toUpperCase()}OUTPUT`, {result, pluginName});
      }
      logger.success(`Completed step "${type}" of plugin "${pluginName}"`);
      return result;
    } catch (error) {
      logger.error(`Failed step "${type}" of plugin "${pluginName}"`);
      extractErrors(error).forEach(err => Object.assign(err, {pluginName}));
      throw error;
    }
  };

  Reflect.defineProperty(validator, 'pluginName', {value: pluginName, writable: false, enumerable: true});

  if (!isFunction(pluginOpt)) {
    if (pluginsPath[path]) {
      logger.success(`Loaded plugin "${type}" from "${path}" in shareable config "${pluginsPath[path]}"`);
    } else {
      logger.success(`Loaded plugin "${type}" from "${path}"`);
    }
  }

  return validator;
};

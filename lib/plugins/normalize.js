const {inspect} = require('util');
const {isString, isObject, isFunction, noop, cloneDeep} = require('lodash');
const importFrom = require('import-from');

module.exports = (pluginType, pluginConfig, logger, validator) => {
  if (!pluginConfig) {
    return noop;
  }
  const {path, ...config} = isString(pluginConfig) || isFunction(pluginConfig) ? {path: pluginConfig} : pluginConfig;
  if (!isFunction(pluginConfig)) {
    logger.log('Load plugin %s', path);
  }
  const plugin = isFunction(path) ? path : importFrom.silent(__dirname, path) || importFrom(process.cwd(), path);

  let func;
  if (isFunction(plugin)) {
    func = plugin.bind(null, cloneDeep(config));
  } else if (isObject(plugin) && plugin[pluginType] && isFunction(plugin[pluginType])) {
    func = plugin[pluginType].bind(null, cloneDeep(config));
  } else {
    throw new Error(
      `The ${pluginType} plugin must be a function, or an object with a function in the property ${pluginType}.`
    );
  }

  return async input => {
    const result = await func(cloneDeep(input));

    if (validator && !validator.validator(result)) {
      throw new Error(`${validator.message} Received: ${inspect(result)}`);
    }
    return result;
  };
};

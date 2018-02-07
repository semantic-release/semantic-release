const {dirname} = require('path');
const {inspect} = require('util');
const SemanticReleaseError = require('@semantic-release/error');
const {isString, isObject, isFunction, noop, cloneDeep} = require('lodash');
const resolveFrom = require('resolve-from');
var childProcess = require('child_process');

module.exports = (pluginType, pluginsPath, globalOpts, pluginOpts, logger, validator) => {
  if (!pluginOpts) {
    return noop;
  }

  const {path, ...config} = isString(pluginOpts) || isFunction(pluginOpts) ? {path: pluginOpts} : pluginOpts;
  if (!isFunction(pluginOpts)) {
    if (pluginsPath[path]) {
      logger.log('Load plugin %s from %s in shareable config %s', pluginType, path, pluginsPath[path]);
    } else {
      logger.log('Load plugin %s from %s', pluginType, path);
    }
  }

  const globalNodeModulesPath = childProcess.execSync('npm root -g').toString().trim();
  console.log(globalNodeModulesPath);

  const basePath = pluginsPath[path]
    ? dirname(resolveFrom.silent(__dirname, pluginsPath[path]) || resolveFrom.silent(globalNodeModulesPath, pluginsPath[path]) || resolveFrom(process.cwd(), pluginsPath[path]))
    : __dirname;
  const plugin = isFunction(path)
    ? path
    : require(resolveFrom.silent(basePath, path) || resolveFrom.silent(globalNodeModulesPath, path) || resolveFrom(process.cwd(), path));

  let func;
  if (isFunction(plugin)) {
    func = plugin.bind(null, cloneDeep({...globalOpts, ...config}));
  } else if (isObject(plugin) && plugin[pluginType] && isFunction(plugin[pluginType])) {
    func = plugin[pluginType].bind(null, cloneDeep({...globalOpts, ...config}));
  } else {
    throw new SemanticReleaseError(
      `The ${pluginType} plugin must be a function, or an object with a function in the property ${pluginType}.`,
      'EPLUGINCONF'
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

const {dirname} = require('path');
const {isString, isFunction, castArray, isArray, isPlainObject, isNil} = require('lodash');
const resolveFrom = require('resolve-from');

const validateStepArrayDefinition = conf =>
  isArray(conf) &&
  (conf.length === 1 || conf.length === 2) &&
  (isString(conf[0]) || isFunction(conf[0])) &&
  (isNil(conf[1]) || isPlainObject(conf[1]));

const validateSingleStep = conf => {
  if (validateStepArrayDefinition(conf)) {
    return true;
  }
  conf = castArray(conf);

  if (conf.length !== 1) {
    return false;
  }

  const [path, config] = parseConfig(conf[0]);
  return (isString(path) || isFunction(path)) && isPlainObject(config);
};

const validateMultipleStep = conf => {
  return conf.every(conf => validateSingleStep(conf));
};

function validatePlugin(conf) {
  return (
    isString(conf) ||
    (isArray(conf) &&
      (conf.length === 1 || conf.length === 2) &&
      (isString(conf[0]) || isPlainObject(conf[0])) &&
      (isNil(conf[1]) || isPlainObject(conf[1]))) ||
    (isPlainObject(conf) && (isNil(conf.path) || isString(conf.path) || isPlainObject(conf.path)))
  );
}

function validateStep({multiple, required}, conf) {
  conf = castArray(conf).filter(Boolean);
  if (required) {
    return conf.length >= 1 && (multiple ? validateMultipleStep : validateSingleStep)(conf);
  }
  return conf.length === 0 || (multiple ? validateMultipleStep : validateSingleStep)(conf);
}

function loadPlugin({cwd}, path, pluginsPath) {
  const basePath = pluginsPath[path]
    ? dirname(resolveFrom.silent(__dirname, pluginsPath[path]) || resolveFrom(cwd, pluginsPath[path]))
    : __dirname;
  return isFunction(path) ? path : require(resolveFrom.silent(basePath, path) || resolveFrom(cwd, path));
}

function parseConfig(plugin) {
  let path;
  let config;
  if (isArray(plugin)) {
    [path, config] = plugin;
  } else if (isPlainObject(plugin) && !isNil(plugin.path)) {
    ({path, ...config} = plugin);
  } else {
    path = plugin;
  }
  return [path, config || {}];
}

module.exports = {validatePlugin, validateStep, loadPlugin, parseConfig};

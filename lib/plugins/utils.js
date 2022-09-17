const {dirname} = require('path');
const {isString, isFunction, castArray, isArray, isPlainObject, isNil} = require('lodash');
const resolveFrom = require('resolve-from');

const validateSteps = (conf) => {
  return conf.every((conf) => {
    if (
      isArray(conf) &&
      (conf.length === 1 || conf.length === 2) &&
      (isString(conf[0]) || isFunction(conf[0])) &&
      (isNil(conf[1]) || isPlainObject(conf[1]))
    ) {
      return true;
    }

    conf = castArray(conf);

    if (conf.length !== 1) {
      return false;
    }

    const [name, config] = parseConfig(conf[0]);
    return (isString(name) || isFunction(name)) && isPlainObject(config);
  });
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

function validateStep({required}, conf) {
  conf = castArray(conf).filter(Boolean);
  if (required) {
    return conf.length >= 1 && validateSteps(conf);
  }

  return conf.length === 0 || validateSteps(conf);
}

async function loadPlugin({cwd}, name, pluginsPath) {
  const basePath = pluginsPath[name]
    ? dirname(resolveFrom.silent(__dirname, pluginsPath[name]) || resolveFrom(cwd, pluginsPath[name]))
    : __dirname;

  // See https://github.com/mysticatea/eslint-plugin-node/issues/250
  // eslint-disable-next-line node/no-unsupported-features/es-syntax
  return isFunction(name) ? name : (await import(resolveFrom.silent(basePath, name) || resolveFrom(cwd, name))).default;
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

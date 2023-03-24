import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { castArray, isArray, isFunction, isNil, isPlainObject, isString } from "lodash-es";
import resolveFrom from "resolve-from";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

export function validatePlugin(conf) {
  return (
    isString(conf) ||
    (isArray(conf) &&
      (conf.length === 1 || conf.length === 2) &&
      (isString(conf[0]) || isPlainObject(conf[0])) &&
      (isNil(conf[1]) || isPlainObject(conf[1]))) ||
    (isPlainObject(conf) && (isNil(conf.path) || isString(conf.path) || isPlainObject(conf.path)))
  );
}

export function validateStep({ required }, conf) {
  conf = castArray(conf).filter(Boolean);
  if (required) {
    return conf.length >= 1 && validateSteps(conf);
  }

  return conf.length === 0 || validateSteps(conf);
}

export async function loadPlugin({ cwd }, name, pluginsPath) {
  const basePath = pluginsPath[name]
    ? dirname(resolveFrom.silent(__dirname, pluginsPath[name]) || resolveFrom(cwd, pluginsPath[name]))
    : __dirname;

  if (isFunction(name)) {
    return name;
  }

  const file = resolveFrom.silent(basePath, name) || resolveFrom(cwd, name);
  const { default: cjsExport, ...esmNamedExports } = await import(`file://${file}`);

  if (cjsExport) {
    return cjsExport;
  }

  return esmNamedExports;
}

export function parseConfig(plugin) {
  let path;
  let config;
  if (isArray(plugin)) {
    [path, config] = plugin;
  } else if (isPlainObject(plugin) && !isNil(plugin.path)) {
    ({ path, ...config } = plugin);
  } else {
    path = plugin;
  }

  return [path, config || {}];
}

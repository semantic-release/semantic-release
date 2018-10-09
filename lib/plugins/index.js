const {identity, isPlainObject, omit, castArray, isNil, isString} = require('lodash');
const AggregateError = require('aggregate-error');
const getError = require('../get-error');
const PLUGINS_DEFINITIONS = require('../definitions/plugins');
const {validatePlugin, validateStep, loadPlugin, parseConfig} = require('./utils');
const pipeline = require('./pipeline');
const normalize = require('./normalize');

module.exports = (context, pluginsPath) => {
  let {options, logger} = context;
  const errors = [];

  const plugins = options.plugins
    ? castArray(options.plugins).reduce((plugins, plugin) => {
        if (validatePlugin(plugin)) {
          const [name, config] = parseConfig(plugin);
          plugin = isString(name) ? loadPlugin(context, name, pluginsPath) : name;

          if (isPlainObject(plugin)) {
            Object.entries(plugin).forEach(([type, func]) => {
              if (PLUGINS_DEFINITIONS[type]) {
                Reflect.defineProperty(func, 'pluginName', {
                  value: isPlainObject(name) ? 'Inline plugin' : name,
                  writable: false,
                  enumerable: true,
                });
                plugins[type] = [...(PLUGINS_DEFINITIONS[type].multiple ? plugins[type] || [] : []), [func, config]];
              }
            });
          } else {
            errors.push(getError('EPLUGINSCONF', {plugin}));
          }
        } else {
          errors.push(getError('EPLUGINSCONF', {plugin}));
        }

        return plugins;
      }, {})
    : [];

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  options = {...plugins, ...options};

  const pluginsConf = Object.entries(PLUGINS_DEFINITIONS).reduce(
    (
      pluginsConf,
      [type, {multiple, required, default: def, pipelineConfig, postprocess = identity, preprocess = identity}]
    ) => {
      let pluginOpts;

      if (isNil(options[type]) && def) {
        pluginOpts = def;
      } else {
        // If an object is passed and the path is missing, merge it with step options
        if (isPlainObject(options[type]) && !options[type].path) {
          options[type] = castArray(plugins[type]).map(
            plugin => (plugin ? [plugin[0], Object.assign(plugin[1], options[type])] : plugin)
          );
        }
        if (!validateStep({multiple, required}, options[type])) {
          errors.push(getError('EPLUGINCONF', {type, multiple, required, pluginConf: options[type]}));
          return pluginsConf;
        }
        pluginOpts = options[type];
      }

      const steps = castArray(pluginOpts).map(pluginOpt =>
        normalize(
          {...context, options: omit(options, Object.keys(PLUGINS_DEFINITIONS), 'plugins')},
          type,
          pluginOpt,
          pluginsPath
        )
      );

      pluginsConf[type] = async input =>
        postprocess(
          await pipeline(steps, pipelineConfig && pipelineConfig(pluginsConf, logger))(await preprocess(input)),
          input
        );

      return pluginsConf;
    },
    plugins
  );
  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  return pluginsConf;
};

const {identity, isPlainObject, omit, castArray, isUndefined} = require('lodash');
const AggregateError = require('aggregate-error');
const getError = require('../get-error');
const PLUGINS_DEFINITIONS = require('../definitions/plugins');
const pipeline = require('./pipeline');
const normalize = require('./normalize');

module.exports = ({cwd, options, logger}, pluginsPath) => {
  const errors = [];
  const plugins = Object.entries(PLUGINS_DEFINITIONS).reduce(
    (
      plugins,
      [type, {configValidator, default: def, pipelineConfig, postprocess = identity, preprocess = identity}]
    ) => {
      let pluginOpts;

      if (isUndefined(options[type])) {
        pluginOpts = def;
      } else {
        const defaultPaths = castArray(def);
        // If an object is passed and the path is missing, set the default one for single plugins
        if (isPlainObject(options[type]) && !options[type].path && defaultPaths.length === 1) {
          [options[type].path] = defaultPaths;
        }
        if (configValidator && !configValidator(options[type])) {
          errors.push(getError('EPLUGINCONF', {type, pluginConf: options[type]}));
          return plugins;
        }
        pluginOpts = options[type];
      }

      const steps = castArray(pluginOpts).map(pluginOpt =>
        normalize({cwd, options: omit(options, Object.keys(PLUGINS_DEFINITIONS)), logger}, type, pluginOpt, pluginsPath)
      );

      plugins[type] = async input =>
        postprocess(await pipeline(steps, pipelineConfig && pipelineConfig(plugins, logger))(await preprocess(input)));

      return plugins;
    },
    {}
  );
  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
  return plugins;
};

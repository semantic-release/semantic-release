const {identity, isPlainObject, omit, castArray, isUndefined} = require('lodash');
const AggregateError = require('aggregate-error');
const getError = require('../get-error');
const PLUGINS_DEFINITIONS = require('../definitions/plugins');
const pipeline = require('./pipeline');
const normalize = require('./normalize');

module.exports = (options, pluginsPath, logger) => {
  const errors = [];
  const plugins = Object.entries(PLUGINS_DEFINITIONS).reduce(
    (
      plugins,
      [type, {configValidator, default: def, pipelineConfig, postprocess = identity, preprocess = identity}]
    ) => {
      let pluginConfs;

      if (isUndefined(options[type])) {
        pluginConfs = def;
      } else {
        // If an object is passed and the path is missing, set the default one for single plugins
        if (isPlainObject(options[type]) && !options[type].path && castArray(def).length === 1) {
          options[type].path = def;
        }
        if (configValidator && !configValidator(options[type])) {
          errors.push(getError('EPLUGINCONF', {type, pluginConf: options[type]}));
          return plugins;
        }
        pluginConfs = options[type];
      }

      const globalOpts = omit(options, Object.keys(PLUGINS_DEFINITIONS));
      const steps = castArray(pluginConfs).map(conf => normalize(type, pluginsPath, globalOpts, conf, logger));

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

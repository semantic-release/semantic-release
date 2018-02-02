const {isArray, isObject, omit, castArray, isUndefined} = require('lodash');
const AggregateError = require('aggregate-error');
const getError = require('../get-error');
const PLUGINS_DEFINITIONS = require('../definitions/plugins');
const pipeline = require('./pipeline');
const normalize = require('./normalize');

module.exports = (options, pluginsPath, logger) => {
  const errors = [];
  const plugins = Object.keys(PLUGINS_DEFINITIONS).reduce((plugins, pluginType) => {
    const {config, default: def} = PLUGINS_DEFINITIONS[pluginType];
    let pluginConfs;

    if (isUndefined(options[pluginType])) {
      pluginConfs = def;
    } else {
      // If an object is passed and the path is missing, set the default one for single plugins
      if (isObject(options[pluginType]) && !options[pluginType].path && !isArray(def)) {
        options[pluginType].path = def;
      }
      if (config && !config.validator(options[pluginType])) {
        errors.push(getError('EPLUGINCONF', {pluginType, pluginConf: options[pluginType]}));
        return plugins;
      }
      pluginConfs = options[pluginType];
    }

    const globalOpts = omit(options, Object.keys(PLUGINS_DEFINITIONS));

    plugins[pluginType] = pipeline(
      castArray(pluginConfs).map(conf => normalize(pluginType, pluginsPath, globalOpts, conf, logger))
    );

    return plugins;
  }, {});
  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
  return plugins;
};

const {isArray, isObject, omit} = require('lodash');
const AggregateError = require('aggregate-error');
const SemanticReleaseError = require('@semantic-release/error');
const PLUGINS_DEFINITION = require('./definitions');
const pipeline = require('./pipeline');
const normalize = require('./normalize');

module.exports = (options, pluginsPath, logger) => {
  const errors = [];
  const plugins = Object.keys(PLUGINS_DEFINITION).reduce((plugins, pluginType) => {
    const {config, output, default: def} = PLUGINS_DEFINITION[pluginType];
    let pluginConfs;
    if (options[pluginType]) {
      // If an object is passed and the path is missing, set the default one for single plugins
      if (isObject(options[pluginType]) && !options[pluginType].path && !isArray(def)) {
        options[pluginType].path = def;
      }
      if (config && !config.validator(options[pluginType])) {
        errors.push(new SemanticReleaseError(config.message, 'EPLUGINCONF'));
        return plugins;
      }
      pluginConfs = options[pluginType];
    } else {
      pluginConfs = def;
    }

    const globalOpts = omit(options, Object.keys(PLUGINS_DEFINITION));

    plugins[pluginType] = isArray(pluginConfs)
      ? pipeline(pluginConfs.map(conf => normalize(pluginType, pluginsPath, globalOpts, conf, logger, output)))
      : normalize(pluginType, pluginsPath, globalOpts, pluginConfs, logger, output);

    return plugins;
  }, {});
  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
  return plugins;
};

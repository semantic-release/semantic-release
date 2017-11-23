const {isArray, isObject} = require('lodash');
const DEFINITIONS = require('./definitions');
const pipeline = require('./pipeline');
const normalize = require('./normalize');

module.exports = (options, logger) =>
  Object.keys(DEFINITIONS).reduce((plugins, pluginType) => {
    const {config, output, default: def} = DEFINITIONS[pluginType];
    let pluginConfs;
    if (options[pluginType]) {
      // If an object is passed and the path is missing, set the default one for single plugins
      if (isObject(options[pluginType]) && !options[pluginType].path && !isArray(def)) {
        options[pluginType].path = def;
      }
      if (config && !config.validator(options[pluginType])) {
        throw new Error(config.message);
      }
      pluginConfs = options[pluginType];
    } else {
      pluginConfs = def;
    }

    plugins[pluginType] = isArray(pluginConfs)
      ? pipeline(pluginConfs.map(conf => normalize(pluginType, conf, logger, output)))
      : normalize(pluginType, pluginConfs, logger, output);

    return plugins;
  }, {});

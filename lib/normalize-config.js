// The idea is to still use internally the old format, but to allow the plugins to be object in the configuration.
// This buys some time to figure out what is the format to be used internally, if the old is optimal, or if some
// refactoring would improve the semantic-release somehow (readability, maintainability etc.)
module.exports = (config) => {
  if (!config || !config.plugins) return config; // No idea if this is possible, but if it is, then handle the situation the old way

  if (Array.isArray(config.plugins)) {
    return config; // The configuration is already in the internally used format
  }

  if (config.plugins.constructor === Object) {
    const normalizedPlugins = Object.keys(config.plugins).map((key) => {
      if (Object.keys(config.plugins[key]).length > 0) {
        return [key, config.plugins[key]];
      }

      return key;
    });
    return {...config, plugins: normalizedPlugins};
  }

  return config; // Again, if the config object is something unpredictable, just return it and handle it the old way.
};

const {isString, isFunction, castArray} = require('lodash');

const validateSingleConfig = conf => {
  conf = castArray(conf);
  return conf.length === 1 && (isString(conf[0]) || isString(conf[0].path) || isFunction(conf[0]));
};

const validateMultipleConfig = conf => castArray(conf).every(conf => validateSingleConfig(conf));

const validateConfig = ({multiple, required}, conf) => {
  conf = castArray(conf).filter(Boolean);
  if (required) {
    return Boolean(conf) && conf.length >= 1 && (multiple ? validateMultipleConfig : validateSingleConfig)(conf);
  }
  return conf.length === 0 || (multiple ? validateMultipleConfig : validateSingleConfig)(conf);
};

module.exports = {validateConfig};

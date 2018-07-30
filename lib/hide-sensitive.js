const {escapeRegExp} = require('lodash');
const {SECRET_REPLACEMENT} = require('./definitions/constants');

module.exports = env => {
  const toReplace = Object.keys(env).filter(
    envVar => /token|password|credential|secret|private/i.test(envVar) && env[envVar].trim()
  );

  const regexp = new RegExp(toReplace.map(envVar => escapeRegExp(env[envVar])).join('|'), 'g');
  return output => (output && toReplace.length > 0 ? output.toString().replace(regexp, SECRET_REPLACEMENT) : output);
};

const {escapeRegExp, size, isString} = require('lodash');
const {SECRET_REPLACEMENT, SECRET_MIN_SIZE} = require('./definitions/constants');

module.exports = (env) => {
  const toReplace = Object.keys(env).filter((envVar) => {
    // https://github.com/semantic-release/semantic-release/issues/1558
    if (envVar === 'GOPRIVATE') {
      return false;
    }

    return /token|password|credential|secret|private/i.test(envVar) && size(env[envVar].trim()) >= SECRET_MIN_SIZE;
  });

  const regexp = new RegExp(
    toReplace.map((envVar) => `${escapeRegExp(env[envVar])}|${escapeRegExp(encodeURI(env[envVar]))}`).join('|'),
    'g'
  );
  return (output) =>
    output && isString(output) && toReplace.length > 0 ? output.toString().replace(regexp, SECRET_REPLACEMENT) : output;
};

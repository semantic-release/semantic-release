const {escapeRegExp} = require('lodash');

const toReplace = Object.keys(process.env).filter(envVar => /token|password|credential|secret|private/i.test(envVar));
const regexp = new RegExp(toReplace.map(envVar => escapeRegExp(process.env[envVar])).join('|'), 'g');

module.exports = output => {
  return output && toReplace.length > 0 ? output.toString().replace(regexp, '[secure]') : output;
};

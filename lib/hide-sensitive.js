const {escapeRegExp} = require('lodash');

const regexp = new RegExp(
  Object.keys(process.env)
    .filter(envVar => /token|password|credential|secret|private/i.test(envVar))
    .map(envVar => escapeRegExp(process.env[envVar]))
    .join('|'),
  'g'
);

module.exports = output => output.replace(regexp, '[secure]');

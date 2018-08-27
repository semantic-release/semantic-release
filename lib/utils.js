const {isFunction} = require('lodash');
const hideSensitive = require('./hide-sensitive');

function extractErrors(err) {
  return err && isFunction(err[Symbol.iterator]) ? [...err] : [err];
}

function hideSensitiveValues(env, objs) {
  const hideFunction = hideSensitive(env);
  return objs.map(obj => {
    Object.getOwnPropertyNames(obj).forEach(prop => {
      if (obj[prop]) {
        obj[prop] = hideFunction(obj[prop]);
      }
    });
    return obj;
  });
}

module.exports = {extractErrors, hideSensitiveValues};

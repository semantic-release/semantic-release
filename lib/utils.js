const {isFunction} = require('lodash');

function extractErrors(err) {
  return err && isFunction(err[Symbol.iterator]) ? [...err] : [err];
}

module.exports = {extractErrors};

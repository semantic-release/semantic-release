const SemanticReleaseError = require('@semantic-release/error');
const ERROR_DEFINITIONS = require('./definitions/errors');

module.exports = (code, ctx = {}) => {
  const {message, details} = ERROR_DEFINITIONS[code](ctx);
  return new SemanticReleaseError(message, code, details);
};

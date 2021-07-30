import SemanticReleaseError from '@semantic-release/error';
import ERROR_DEFINITIONS from './definitions/errors.js';

export default (code, ctx = {}) => {
  const {message, details} = ERROR_DEFINITIONS[code](ctx);
  return new SemanticReleaseError(message, code, details);
};

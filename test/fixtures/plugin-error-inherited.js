const SemanticReleaseError = require('@semantic-release/error');

class InheritedError extends SemanticReleaseError {
  constructor(message, code) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
  }
}

module.exports = () => {
  throw new InheritedError('Inherited error', 'EINHERITED');
};

const SemanticReleaseError = require('@semantic-release/error');

class InheritedError extends SemanticReleaseError {
  constructor(message, code, newProperty) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
  }
}

module.exports = function(config, options, cb) {
  cb(new InheritedError('Inherited error', 'EINHERITED'));
};

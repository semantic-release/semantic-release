import SemanticReleaseError from "@semantic-release/error";

class InheritedError extends SemanticReleaseError {
  constructor(message, code) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
  }
}

export default () => {
  throw new InheritedError("Inherited error", "EINHERITED");
};

module.exports = class SemanticReleaseError extends Error {
  constructor (message, code) {
    super(message)
    this.code = code
  }
}

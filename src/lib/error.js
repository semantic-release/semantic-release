module.exports = class SemanticReleaseError extends Error {
  constructor (message, code) {
    super()
    this.message = message
    this.code = code
  }
}

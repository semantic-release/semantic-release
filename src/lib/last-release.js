module.exports = function (config, cb) {
  const {plugins} = config

  plugins.getLastRelease(config, cb)
}

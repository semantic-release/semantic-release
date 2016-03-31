var fs = require('fs')
var normalizeData = require('normalize-package-data')

module.exports = function (file) {
  var pkg = JSON.parse(fs.readFileSync(file))
  normalizeData(pkg)
  return pkg
}

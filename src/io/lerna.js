var Repository = require('lerna/lib/Repository').default;
var PackageUtilities = require('lerna/lib/PackageUtilities').default;

module.exports = {
  getAllPackages: function () {
    var packagesLocation = new Repository().packagesLocation;
    return PackageUtilities.getPackages(packagesLocation);
  }
};

var Repository = require('lerna/lib/Repository');
var PackageUtilities = require('lerna/lib/PackageUtilities');

module.exports = {
  getAllPackages: function () {
    var packagesLocation = new Repository().packagesLocation;
    return PackageUtilities.getPackages(packagesLocation);
  }
};

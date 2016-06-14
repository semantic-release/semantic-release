var async = require('async');
var path = require('path');

var Repository = require('lerna/lib/Repository').default;
var PackageUtilities = require('lerna/lib/PackageUtilities').default;

var process = require('process');

var log = require('../utils/log');
var bindTasks = require('../utils/bind-tasks');

module.exports = {
  getAllPackages: function () {
    var packagesLocation = new Repository().packagesLocation;
    return PackageUtilities.getPackages(packagesLocation);
  },

  forEachPackage: function (tasks, options, done) {
    var extraContext = (options && options.extraContext) || {};
    var asyncType = (options && options.asyncType) || async.series;

    var packages = module.exports.getAllPackages();
    var packageLocations = packages.map(function (pkg) {
      return pkg.location;
    });

    var tasksToRunInEachPackage = packageLocations.map(function (packagePath) {
      return function (next) {
        var contextBoundTasks = bindTasks(tasks, Object.assign({}, extraContext, {packagePath: packagePath}), packagePath);

        asyncType(contextBoundTasks, function (err) {
          err && log.error(err);
          next();
        });
      }
    });

    async.series(tasksToRunInEachPackage, function (err) {
      err && log.error(err);
      done && done();
    });
  }
};

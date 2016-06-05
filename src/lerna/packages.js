var async = require('async');
var path = require('path');

var Repository = require('lerna/lib/Repository').default;
var PackageUtilities = require('lerna/lib/PackageUtilities').default;

var process = require('process');

var log = require('../utils/log');

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
        var contextBoundTasks = tasks.map(function (task) {
          return function () {
            log.info('Executing ' + task.name + ' in ' + path.relative('.', packagePath));
            var context = Object.assign({}, extraContext, {packagePath: packagePath});
            return task.apply(context, arguments);
          }
        });

        asyncType(contextBoundTasks, function (err) {
          err && log.error(err);
          next();
        });
      }
    });

    async.series(tasksToRunInEachPackage, function (err) {
      err && log.error(err);
      done();
    });
  }
};
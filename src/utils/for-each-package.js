var async = require('async');
var path = require('path');

var process = require('process');

var log = require('../utils/log');
var bindTasks = require('../utils/bind-tasks');

module.exports = function forEachPackage (tasks, options, done) {
  var extraContext = (options && options.extraContext) || {};
  var asyncType = (options && options.asyncType) || async.series;
  var packages = options.allPackages;

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
};

var sh = require('../src/utils/sh');

var async = require('async');
var cwd = require('process').cwd();
var path = require('path');

var Repository = require('lerna/lib/Repository').default;
var UpdatedCommand = require('lerna/lib/commands/UpdatedCommand').default;

function pushTags (done) {
  sh([
    {cmd: 'git', args: ['push', '--tags'], opts: {cwd: cwd}}
  ], done);
}

function publishPackage (path, done) {
  sh([
    {cmd: 'npm', args: ['publish', path], opts: {cwd: cwd}}
  ], done);
}

function getUpdatedPackages (done) {
  var updatedCommand = new UpdatedCommand([], {});

  // We can't use updatedCommand.run() as this will exit TODO: PR to add an option to run specifying whether it'd exit
  updatedCommand.runValidations();
  updatedCommand.runPreparations();
  updatedCommand.initialize(function () {
    updatedCommand.execute(function () {
      done(null, updatedCommand.updates);
    });
  });
}

function publishUpdatedPackages (updatedPackages, done) {
  var allPackageLocations = updatedPackages.map(function (pkg) {
    return pkg.location
  });

  var packageRelativeLocations = allPackageLocations.map(function (location) {
    return path.relative(cwd, location);
  });

  async.series(packageRelativeLocations.map(function (path) {
      return function (packagePublishedCallback) {
        publishPackage(path, packagePublishedCallback)
      };
    }), done);
}


module.exports = function perform () {
  async.waterfall([
    pushTags,
    getUpdatedPackages,
    publishUpdatedPackages
  ]);
};

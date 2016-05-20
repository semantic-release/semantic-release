var sh = require('../src/utils/sh');

var async = require('async');
var cwd = require('process').cwd();
var path = require('path');

var Repository = require('lerna/lib/Repository').default;
var PackageUtilities = require('lerna/lib/PackageUtilities').default;


function pushTags (done) {
  sh([
    {cmd: 'git', args: ['push', '--tags'], opts: {cwd: cwd}},
  ], done);
}

function publishPackage (path, done) {
  sh([
    {cmd: 'npm', args: ['publish', path], opts: {cwd: cwd}}
  ], done);
}

function publishPackages (done) {
  var packagesLocation = new Repository().packagesLocation;
  var packageNames = PackageUtilities.getPackages(packagesLocation).map(function (pkg) {
    return pkg.name
  });

  var packageRelativePaths = packageNames.map(function (name) {
    return path.relative(cwd, PackageUtilities.getPackagePath(packagesLocation, name));
  });

  async.series(packageRelativePaths.map(function (path) {
      return function (packagePublishedCallback) {
        publishPackage(path, packagePublishedCallback)
      };
    }), done);
}


module.exports = function perform () {
  async.series([
    pushTags,
    publishPackages
  ]);
};

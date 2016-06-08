var async = require('async');
var cwd = require('process').cwd;
var path = require('path');
var fs = require('fs');
var shell = require('shelljs');

var lernaPackages = require('./lerna/packages');
var tagging = require('./utils/tagging');
var log = require('./utils/log');

function pushTags (done) {
  shell.exec('git push origin --tags', function (code) {
    done(code === 0 ? null : code);
  });
}

function pushCommits (done) {
  shell.exec('git push origin', function (code) {
    done(code === 0 ? null : code);
  });
}

function publishPackage (relativePath, done) {
  var rootPath = path.resolve(cwd());
  var packagePath =  path.resolve(relativePath);
  setupGitSymlink(rootPath, packagePath);

  shell.exec('npm publish ' + relativePath, function (code) {
    removeGitSymlink(packagePath);
    done(code === 0 ? null : code);
  });
}

/*
 The symlinking is only necessary because package.json's gitHead isn't always populated with lerna. See
 https://github.com/npm/read-package-json/issues/66
 */

function setupGitSymlink (rootPath, packagePath) {
  var rootPathGit = path.join(rootPath, '.git');
  var packagePathGit = path.join(packagePath, '.git');
  shell.exec('ln -sf ' + rootPathGit + ' ' + packagePathGit);
}


function removeGitSymlink (packagePath) {
  shell.exec('unlink ' + path.join(packagePath, '.git'));
}

function isPackageUpdated (pkg, cb) {
  var npmVersion = shell.exec(['npm view', pkg.name, 'version'].join(' '), {silent: true});
  var publishedVersion = npmVersion.stdout.trim();
  var outOfDate = publishedVersion !== pkg.version;
  log.info(pkg.name + '@' + pkg.version, outOfDate ? ('has been updated, since version is newer than ' + publishedVersion) : 'is up to date');
  cb(null, {pkg: pkg, updated: outOfDate}); //if it 404's, it's !==, therefore new
}

function getUpdatedPackages (done) {
  var allPackages = lernaPackages.getAllPackages();

  async.parallel(allPackages.map(function (pkg) {
    return function getLatestVersion (done) {
      isPackageUpdated(pkg, done);
    }
  }), function gotLatestVersions (err, results) {
    var updatedPackages = results.filter(function (result) {
      return result.updated;
    }).map(function (result) {
      return result.pkg;
    });
    done(null, updatedPackages);
  });
}

function publishUpdatedPackages (updatedPackages, done) {
  log.info('Publishing', updatedPackages.length, 'updated packages');

  var updatedPackageLocations = updatedPackages.map(function (pkg) {
    return pkg.location
  });

  var updatedPackageRelativeLocations = updatedPackageLocations.map(function (location) {
    return path.relative(cwd(), location);
  });

  var releasedPackages = updatedPackages.map(function (pkg) {
    return tagging.lerna(pkg.name, pkg.version);
  });

  async.series(updatedPackageRelativeLocations.map(function (path) {
    return function (packagePublishedCallback) {
      publishPackage(path, packagePublishedCallback)
    };
  }), function (err) {
    done(err, releasedPackages);
  });
}

function writeReleasedPackagesFile (releasedPackages, done) {
  fs.writeFile('.released-packages', releasedPackages.join('\n'), function (err) {
    done(err)
  });
}

module.exports = function perform (config) {
  async.waterfall([
    pushCommits,
    pushTags,
    getUpdatedPackages,
    publishUpdatedPackages,
    writeReleasedPackagesFile
  ], function (err) {
    if (err) {
      log.error(err.message);
    }
  });
};

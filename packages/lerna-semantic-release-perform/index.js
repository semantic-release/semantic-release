var async = require('async');
var path = require('path');

var tagging = require('lerna-semantic-release-utils').tagging;
var log = require('lerna-semantic-release-utils').log;
var bindTasks = require('lerna-semantic-release-utils').bindTasks;

function pushTags (done) {
  this.io.git.pushTags()(function(err) {
    done(err);
  });
}

function pullTags (done) {
  this.io.git.pullTags()(function(err) {
    done(err);
  });
}

function pullCommits (done) {
  this.io.git.pull()(function(err) {
    done(err);
  });
}

function pushCommits (done) {
  this.io.git.push()(function(err) {
    done(err);
  });
}

function publishPackage (relativePath, io, done) {
  var rootPath = path.resolve(io.shell.cwdSync());
  var packagePath =  path.resolve(relativePath);
  var pkg = JSON.parse(io.fs.readFileSync(path.resolve(path.join(packagePath, 'package.json'))));

  // See https://github.com/semantic-release/semantic-release/issues/244 for issue to move this back to semantic-release
  if (pkg.private) {
    log.info('Skipping publish for', pkg.name, 'because it is marked as private');
    done(null);
    return;
  }

  setupGitSymlink(rootPath, packagePath, io.shell);

  io.npm.publish(relativePath)(function (err) {
    removeGitSymlink(packagePath, io.shell);
    done(err);
  });
}

/*
 The symlinking is only necessary because package.json's gitHead isn't always populated with lerna. See
 https://github.com/npm/read-package-json/issues/66
 */

function setupGitSymlink (rootPath, packagePath, shell) {
  var rootPathGit = path.join(rootPath, '.git');
  var packagePathGit = path.join(packagePath, '.git');
  shell.lnSync(rootPathGit, packagePathGit);
}


function removeGitSymlink (packagePath, shell) {
  shell.unlinkSync(path.join(packagePath, '.git'));
}

function isPackageUpdated (pkg, npm, cb) {
  npm.getVersion(pkg.name)(function (err, publishedVersion) {
    var outOfDate = publishedVersion !== pkg.version;
    log.info(pkg.name + '@' + pkg.version, outOfDate ? ('has been updated, since version is newer than ' + publishedVersion) : 'is up to date');
    cb(null, {pkg: pkg, updated: outOfDate}); //if it 404's, it's !==, therefore new //TODO move this logic into getVersion
  });
}

function getUpdatedPackages (done) {
  var allPackages = this.io.lerna.getAllPackages();
  var npm = this.io.npm;

  async.parallel(allPackages.map(function (pkg) {
    return function getLatestVersion (done) {
      isPackageUpdated(pkg, npm, done);
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
  const io = this.io;
  log.info('Publishing', updatedPackages.length, 'updated packages');

  const updatedPackageLocations = updatedPackages.map(function (pkg) {
    return {pkg: pkg, path: pkg.location}
  });

  const updatedPackageRelativeLocations = updatedPackageLocations.map(function (packageLocation) {
    return {pkg: packageLocation.pkg, path: path.relative(io.shell.cwdSync(), packageLocation.path)};
  });

  var releasedPackages = [];

  async.series(updatedPackageRelativeLocations.map(function (packageRelativeLocation) {
    return function (packagePublishedCallback) {
      publishPackage(packageRelativeLocation.path, io, function (err) {
        const pkg = packageRelativeLocation.pkg;
        if (err) {
          log.info(`Failed to publish ${pkg.name}@${pkg.version}`);
          packagePublishedCallback(null);
          return;
        }
        const tag = tagging.lerna(pkg.name, pkg.version);
        releasedPackages.push(tag);
        packagePublishedCallback(null);

      });
    };
  }), function (err) {
    done(err, releasedPackages);
  });
}

function writeReleasedPackagesFile (releasedPackages, done) {
  this.io.fs.writeFile('.released-packages', releasedPackages.join('\n'), function (err) {
    done(err)
  });
}

module.exports = function perform (config) {
  async.waterfall(bindTasks([
    pullCommits,
    pushCommits,
    pullTags,
    pushTags,
    getUpdatedPackages,
    publishUpdatedPackages,
    writeReleasedPackagesFile
  ], {
    io: config.io
  }),
  function (err) {
    if (err) {
      log.error(err.message);
    }
    if (typeof config.callback === 'function') {
      config.callback(err);
    }
  });
};

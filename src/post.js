var conventionalChangelog = require('conventional-changelog');
var async = require('async');
var shell = require('shelljs');
var fs = require('fs');
var path = require('path');

var lernaPackages = require('./lerna/packages');
var execAsTask = require('./utils/exec-as-task');
var analyzer = require('./plugins/analyzer');
var log = require('./utils/log');

var CHANGELOG_FILE_NAME = 'CHANGELOG.md';

function createChangelog (done) {
  var packagePath = this.packagePath;
  var pkgJsonPath = path.join(packagePath, 'package.json');
  var writeStream = fs.createWriteStream(path.join(packagePath, CHANGELOG_FILE_NAME), {flags: 'a'});
  var stream = conventionalChangelog({
    preset: 'angular',
    transform: function (commit, cb) {
      var pkgJsonFile = JSON.parse(fs.readFileSync(pkgJsonPath));
      if (analyzer.isRelevant(commit.body, pkgJsonFile.name)) {
        cb(null, commit);
      } else {
        cb(null, null);
      }
    },
    pkg: {
      path: pkgJsonPath
    }
  }).pipe(writeStream);

  stream.on('close', function () {
    done(null);
  });
}

function enterPackage (done) {
  shell.pushd(this.packagePath);
  done();
}
function exitPackage (done) {
  shell.popd();
  done();
}

module.exports = function () {
  lernaPackages.forEachPackage([
    createChangelog,
    enterPackage,
    execAsTask('touch ' + CHANGELOG_FILE_NAME),
    execAsTask('git add ' + CHANGELOG_FILE_NAME),
    exitPackage
  ], {}, function done () {
    async.series([
      execAsTask('git commit -anm\'docs(changelog): appending to changelog\' --allow-empty'),
      execAsTask('git push origin')
    ]);
  });
};

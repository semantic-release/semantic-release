var conventionalChangelog = require('conventional-changelog');
var async = require('async');
var shell = require('shelljs');
var fs = require('fs');
var path = require('path');
var simpleGit = require('simple-git');
var semver = require('semver');
var dateFormat = require('dateformat');


var lernaPackages = require('./lerna/packages');
var execAsTask = require('./utils/exec-as-task');
var tagging = require('./utils/tagging');
var analyzer = require('./plugins/analyzer');
var log = require('./utils/log');

var CHANGELOG_FILE_NAME = 'CHANGELOG.md';

function getPkgPath (packagePath) {
  return path.join(packagePath, 'package.json')
}

function getPkg (packagePath) {
  return JSON.parse(fs.readFileSync(getPkgPath(packagePath)));
}

/**
 * Reformat a commit to contain a version (based on git tags) and the proper date.
 * Mostly from the default (conventional-changelog-core/lib/merge-config.js)
 * @param commit
 * @returns commit the modified commit
 */
function reformatCommit (commit) {
  var rtag = /tag:\s*[v=]?(.+?)[,\)]/gi;

  if (commit.committerDate) {
    commit.committerDate = dateFormat(commit.committerDate, 'yyyy-mm-dd', true);
  }

  if (commit.gitTags) {
    var match = rtag.exec(commit.gitTags);
    rtag.lastIndex = 0;

    if (match) {
      commit.version = match[1];
    }
  }

  return commit;
}

function createChangelog (done) {
  var packagePath = this.packagePath;
  var rootPackageRepository = this.rootPackageRepository;

  var pkgJsonPath = getPkgPath(packagePath);
  var writeStream = fs.createWriteStream(path.join(packagePath, CHANGELOG_FILE_NAME));
  var stream = conventionalChangelog({
    preset: 'angular',
    transform: function (commit, cb) {
      var pkgJsonFile = getPkg(packagePath);

      var isRelevant = analyzer.isRelevant(commit.body, pkgJsonFile.name);

      if (!isRelevant && !commit.gitTags) {
        cb(null, null);
        return;
      }

      commit = reformatCommit(commit);

      cb(null, commit);
    },
    pkg: {
      path: pkgJsonPath
    },
    releaseCount: 0
  }, {
    repository: rootPackageRepository
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

function isTagRelevant (packageName, tag) {
  var tagParts = tagging.getTagParts(tag);
  return tagParts && tagParts.version && tagParts.name === packageName;
}

function replaceTags (oldTags, newTagFormatter) {
  oldTags.forEach(function renameTag (oldTags) {
    var tagParts = tagging.getTagParts(oldTags);
    shell.exec('git tag ' + newTagFormatter(tagParts.name, tagParts.version) + ' ' + oldTags);
  });
  shell.exec('git tag -d ' + oldTags.join(' '));
}

function createSemverTags (done) {
  var packageName = getPkg(this.packagePath).name;
  simpleGit().tags(function (err, tags) {
    var relevantLernaTags = tags.all.filter(isTagRelevant.bind(this, packageName));
    replaceTags(relevantLernaTags, tagging.semver);
    done(err);
  });
}

function removeSemverTags (done) {
  var packageName = getPkg(this.packagePath).name;
  simpleGit().tags(function (err, tags) {
    var relevantSemverTags = tags.all.filter(isTagRelevant.bind(this, packageName));
    replaceTags(relevantSemverTags, tagging.lerna);
    done(err);
  })
}

module.exports = function () {
  var rootPackageRepository = JSON.parse(fs.readFileSync('./package.json')).repository;
  lernaPackages.forEachPackage([
    createSemverTags,
    createChangelog,
    removeSemverTags,
    enterPackage,
    execAsTask('touch ' + CHANGELOG_FILE_NAME),
    execAsTask('git add ' + CHANGELOG_FILE_NAME),
    exitPackage
  ], {
    rootPackageRepository: rootPackageRepository
  }, function done () {
    async.series([
      //execAsTask('git commit -anm\'docs(changelog): appending to changelog\' --allow-empty'),
      //execAsTask('git push origin')
    ]);
  });
};

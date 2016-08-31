var conventionalChangelog = require('conventional-changelog');
var async = require('async');
var fs = require('fs');
var path = require('path');
var dateFormat = require('dateformat');


var forEachPackage = require('lerna-semantic-release-utils').forEachPackage;
var tagging = require('lerna-semantic-release-utils').tagging;
var analyzer = require('lerna-semantic-release-analyze-commits');

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
  var io = this.io;

  var pkgJsonPath = getPkgPath(packagePath);
  var writeStream = io.fs.createWriteStream(path.join(packagePath, CHANGELOG_FILE_NAME));
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
    repoUrl: typeof rootPackageRepository !== 'object' ? rootPackageRepository : rootPackageRepository.url
  }, {}, {}, {
    finalizeContext: function (context) {
      const tagParts = tagging.getTagParts(context.version);
      if (!tagParts) {
        return context;
      }
      context.version = tagging.lerna(tagParts.name, tagParts.version);
      context.gitSemverTags = context.gitSemverTags.map(function (gitSemverTag) {
        const tagParts = tagging.getTagParts(gitSemverTag);
        const transformedTag = tagParts ? tagging.lerna(tagParts.name, tagParts.version) : gitSemverTag;
        return transformedTag;
      });
      return context;
    }
  }).pipe(writeStream);

  stream.on('close', function () {
    done(null);
  });
}

function isTagRelevant (packageName, tag) {
  var tagParts = tagging.getTagParts(tag);
  return tagParts && tagParts.version && tagParts.name === packageName;
}

function replaceTags (oldTags, newTagFormatter, git, done) {

  async.series(oldTags.map(function renameTag (oldTag) {
    return function (done) {
      var tagParts = tagging.getTagParts(oldTag);
      git.tag(newTagFormatter(tagParts.name, tagParts.version) + ' ' + oldTag, 'temporary tag')(done);
    };
  }), function seriesComplete (errListTag) {
    git.tagDelete(oldTags)(function (errDeleteTag) {
      done(errListTag || errDeleteTag);
    });
  });
}

function createSemverTags (done) {
  var git = this.io.git;
  var packageName = getPkg(this.packagePath).name;
  git.tagList()(function (err, tags) {
    var relevantLernaTags = tags.all.filter(isTagRelevant.bind(this, packageName));
    replaceTags(relevantLernaTags, tagging.semver, git, done);
  });
}

function removeSemverTags (done) {
  var git = this.io.git;
  var packageName = getPkg(this.packagePath).name;
  git.tagList()(function (err, tags) {
    var relevantSemverTags = tags.all.filter(isTagRelevant.bind(this, packageName));
    replaceTags(relevantSemverTags, tagging.lerna, git, done);
  })
}

module.exports = function (config) {
  var rootPackageRepository = JSON.parse(fs.readFileSync('./package.json')).repository;
  forEachPackage([
    createSemverTags,
    createChangelog,
    removeSemverTags
  ], {
    allPackages: config.io.lerna.getAllPackages(),
    extraContext: {
      rootPackageRepository: rootPackageRepository,
      io: config.io
    }
  }, (err) => {
    if (typeof config.callback === 'function') {
      config.callback(err);
    }
  });
};

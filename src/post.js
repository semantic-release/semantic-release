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
var analyzer = require('./plugins/analyzer');
var log = require('./utils/log');

var CHANGELOG_FILE_NAME = 'CHANGELOG.md';

function getPkgPath (packagePath) {
  return path.join(packagePath, 'package.json')
}

function getPkg (packagePath) {
  return JSON.parse(fs.readFileSync(getPkgPath(packagePath)));
}

function getTagParts (tag, separator, isVersionFirst) {
  var parts = tag.split(separator);
  if (parts.length !== 2) {
    return null;
  }
  return {
    packageName: isVersionFirst ? parts[1] : parts[0],
    version: isVersionFirst ? parts[0] : parts[1]
  }
}

function isValidTag (tagParts) {
  return tagParts && tagParts.packageName && (semver.valid(tagParts.version))
}

function makeTemporaryTag (tagParts) {
  return tagParts.version + '-tmp-duplicate-tag-' + tagParts.packageName;
}

function makeLernaTag (tagParts) {
  return tagParts.packageName + '@' + tagParts.version;
}

function getTemporaryTagParts (temporaryTag) {
  return getTagParts(temporaryTag, '-tmp-duplicate-tag-', true);
}

function getLernaTagParts (lernaTag) {
  return getTagParts(lernaTag, '@', false);
}

function addVersionToCommit (commit) {
  var rtag = /tag:\s*[v=]?(.+?)[,\)]/gi;
  if (commit.gitTags) {
    console.log(commit.gitTags);
    var match = rtag.exec(commit.gitTags);
    rtag.lastIndex = 0;

    if (!match) {
      return commit;
    }

    var temporaryTag = match[1];
    var tagParts = getTemporaryTagParts(temporaryTag);
    if (isValidTag(tagParts)) {
      commit.version = makeLernaTag(tagParts);
    }
  }

  return commit;
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

  }).pipe(writeStream);

  stream.on('close', function () {
    done(null);
  });
}



function temporarilyRenameTags (done) {
  var packageName = getPkg(this.packagePath).name;
  simpleGit().tags(function (err, tags) {
    var relevantTags = tags.all.filter(function isTagRelevant (lernaTag) {
      var tagParts = getLernaTagParts(lernaTag);
      return isValidTag(tagParts) && tagParts.packageName === packageName;
    });

    console.log(relevantTags);

    relevantTags.forEach(function renameTag (lernaTag) {
      shell.exec('git tag ' + makeTemporaryTag(getLernaTagParts(lernaTag)) + ' ' + lernaTag);
      shell.exec('git tag -d ' + lernaTag);
    });

    done(err);
  });
}

function unRenameTags (done) {
  var packageName = getPkg(this.packagePath).name;
  simpleGit().tags(function (err, tags) {
    var relevantTags = tags.all.filter(function isTagRelevant (temporaryTag) {
      var tagParts = getTemporaryTagParts(temporaryTag);
      return isValidTag(tagParts) && tagParts.packageName === packageName;
    });

    relevantTags.forEach(function unRenameTag (temporaryTag) {
      shell.exec('git tag ' + makeLernaTag(getTemporaryTagParts(temporaryTag)) + ' ' + temporaryTag);
      shell.exec('git tag -d ' + temporaryTag);
    });

    done(err);
  })
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
    temporarilyRenameTags,
    createChangelog,
    unRenameTags,
    enterPackage,
    execAsTask('touch ' + CHANGELOG_FILE_NAME),
    execAsTask('git add ' + CHANGELOG_FILE_NAME),
    exitPackage
  ], {}, function done () {
    async.series([
      //execAsTask('git commit -anm\'docs(changelog): appending to changelog\' --allow-empty'),
      //execAsTask('git push origin')
    ]);
  });
};

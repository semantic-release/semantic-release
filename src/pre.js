var async = require('async');
var fs = require('fs');
var path = require('path');
var npmconf = require('npmconf');
var rc = require('rc');
var shell = require('shelljs');
var gitHead = require('git-head');

var srPre = require('semantic-release/dist/pre');
var srNormalize = require('semantic-release/dist/lib/plugins').normalize;
var srRegistry = require('semantic-release/dist/lib/get-registry');

var makeTag = require('./utils/make-tag');
var execAsTask = require('./utils/exec-as-task');
var log = require('./utils/log');
var lernaPackages = require('./lerna/packages');

function getPkgLocation (packagePath) {
  return path.join(packagePath, 'package.json')
}

function getPkg (packagePath) {
  return JSON.parse(fs.readFileSync(getPkgLocation(packagePath)))
}

function getNpmConfig (done) {
  npmconf.load({}, done);
}

function makeSrConfig (npmConfig, done) {
  var pkg = getPkg(this.packagePath);

  var defaults = {
    options: {
      branch: 'master'
    }
  };

  var srConfig = Object.assign({}, defaults, {
    env: process.env,
    plugins: {
      "analyzeCommits": require('./plugins/analyzer.js').default,
      "getLastRelease": srNormalize({}, "@semantic-release/last-release-npm"),
      "verifyRelease": srNormalize({}, "semantic-release/dist/lib/plugin-noop")
    },
    npm: {
      auth: {
        token: process.env.NPM_TOKEN
      },
      loglevel: npmConfig.get('loglevel'),
      registry: srRegistry(pkg, npmConfig),
      tag: (pkg.publishConfig || {}).tag || npmConfig.get('tag') || 'latest'
    },
    pkg: pkg

  });

  done(null, srConfig);
}

function pre (srConfig, done) {
  srPre(srConfig, function (err, nextRelease) {
    done(err, nextRelease);
  });
}

function releaseTypeToNpmVersionType (releaseType) {
  return releaseType === 'initial' ? 'major' : releaseType;
}

function bumpVersionCommitAndTag (nextRelease, done) {
  var packagePath = this.packagePath;
  var releaseHash = this.releaseHash;

  if (!nextRelease) {
    done(null);
    return;
  }

  log.info(nextRelease);

  var lernaTag = makeTag.lerna(getPkg(packagePath).name, nextRelease.version);
  var semanticTag = makeTag.semantic(getPkg(packagePath).name, nextRelease.version);

  log.info('Creating tags', lernaTag, 'and', semanticTag);

  shell.pushd(packagePath);
  async.series([
    execAsTask('npm version ' + releaseTypeToNpmVersionType(nextRelease.type) + ' --git-tag-version false'),
    execAsTask('git commit -anm\'chore: (release): releasing component\n\nReleased from sha ' + releaseHash +'\' --allow-empty'),
    execAsTask('git tag ' + semanticTag),
    execAsTask('git tag ' + lernaTag)
  ], function (err) {
    shell.popd();
    done(err);
  });
}

module.exports = function () {
  gitHead(function (err, releaseHash) {
    err && log.error(err);

    lernaPackages.forEachPackage([
      getNpmConfig,
      makeSrConfig,
      pre,
      bumpVersionCommitAndTag
    ], {
      asyncType: async.waterfall,
      extraContext:  {releaseHash: releaseHash}
    });

  });

};

var async = require('async');
var path = require('path');
var npmconf = require('npmconf');
var rc = require('rc');

var srRegistry = require('semantic-release/dist/lib/get-registry');

var tagging = require('lerna-semantic-release-utils').tagging;
var log = require('lerna-semantic-release-utils').log;
var forEachPackage = require('lerna-semantic-release-utils').forEachPackage;

function getPkgLocation (packagePath) {
  return path.join(packagePath, 'package.json')
}

function getPkg (packagePath, fs) {
  return JSON.parse(fs.readFileSync(getPkgLocation(packagePath)))
}

function getNpmConfig (done) {
  npmconf.load({}, done);
}

function makeSrConfig (npmConfig, done) {
  var pkg = getPkg(this.packagePath, this.io.fs);

  var defaults = {
    options: {
      branch: 'master'
    }
  };

  var srConfig = Object.assign({}, defaults, {
    env: process.env,
    plugins: this.io.semanticRelease.plugins,
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
  this.io.semanticRelease.pre(srConfig, function (err, nextRelease) {
    done(err, nextRelease);
  });
}

function releaseTypeToNpmVersionType (releaseType) {
  return releaseType === 'initial' ? 'major' : releaseType;
}

function bumpVersionCommitAndTag (nextRelease, done) {
  var packagePath = this.packagePath;
  var releaseHash = this.releaseHash;
  var io = this.io;

  if (!nextRelease) {
    done(null);
    return;
  }

  log.info(nextRelease);
  var lernaTag = tagging.lerna(getPkg(packagePath, io.fs).name, nextRelease.version);

  log.info('Creating tag', lernaTag);

  io.shell.pushdSync(packagePath);

  var releaseCommitMessage = 'chore(release): releasing component\n\naffects: ' + lernaTag + '\n\nReleased from sha ' + releaseHash;

  async.series([
    io.npm.version(releaseTypeToNpmVersionType(nextRelease.type)),
    io.git.commit(releaseCommitMessage + '\nTag for lerna release'),
    io.git.tag(lernaTag, 'tag for lerna releases')
  ], function (err) {
    io.shell.popdSync();
    done(err);
  });
}

module.exports = function (config) {
  config.io.git.head(function (err, releaseHash) {
    err && log.error(err);

    forEachPackage([
      getNpmConfig,
      makeSrConfig,
      pre,
      bumpVersionCommitAndTag
    ], {
      allPackages: config.io.lerna.getAllPackages(),
      asyncType: async.waterfall,
      extraContext:  {
        releaseHash: releaseHash,
        io: config.io
      }
    }, (err) => {
      if (typeof config.callback === 'function') {
        config.callback(err);
      }
    });

  });

};

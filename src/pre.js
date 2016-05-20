var async = require('async');
var cwd = require('process').cwd();
var fs = require('fs');
var path = require('path');
var npmconf = require('npmconf');
var rc = require('rc');
var git = require("nodegit");

var srPre = require('semantic-release/dist/pre');
var srNormalize = require('semantic-release/dist/lib/plugins').normalize;
var srRegistry = require('semantic-release/dist/lib/get-registry');

var sh = require('../src/utils/sh');

function getPkg () {
  return JSON.parse(fs.readFileSync(path.join(cwd, 'package.json')))
}

function getNpmConfig (done) {
  npmconf.load({}, done);
}

function makeSrConfig (npmConfig, done) {
  var pkg = getPkg();

  var defaults = {
    options: {
      branch: 'master'
    }
  };

  var srConfig = Object.assign({}, defaults, {
    env: process.env,
    plugins: {
      "analyzeCommits": srNormalize({}, "semantic-release-lerna-analyzer"),
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
    done(null, nextRelease);
  });
}

function tag (nextRelease, done) {
  if (!nextRelease) {
    done(null);
    return;
  }

  var tag = [getPkg().name, '@', nextRelease.version].join('');
  sh([
    {cmd: 'npm', args: ['version', nextRelease.type, '--git-tag-version', 'false'], opts: {cwd: cwd}},
    {cmd: 'git', args: ['commit', '-am\'release: (' + tag + '): releasing component\''], opts: {cwd: cwd}},
    {cmd: 'git', args: ['tag', tag], opts: {cwd: cwd}}
  ], done);
}

module.exports = function () {
  async.waterfall([
    getNpmConfig,
    makeSrConfig,
    pre,
    tag
  ]);
};

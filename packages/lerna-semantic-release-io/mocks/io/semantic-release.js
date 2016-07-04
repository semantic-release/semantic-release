
var srNormalize = require('semantic-release/dist/lib/plugins').normalize;
var srPre = require('semantic-release/dist/pre');

var noop = srNormalize({}, "semantic-release/dist/lib/plugin-noop");
var analyzeCommits = require('lerna-semantic-release-analyze-commits').analyze;

var mockNpmLatestVersions = {};
var getLastRelease = require("lerna-semantic-release-get-last-release").bind(null, {
  lastReleaseNpm: function (_ref, cb) {
    const packageName = _ref.pkg.name;
    cb(null, {
      version: mockNpmLatestVersions[packageName].version,
      gitHead: mockNpmLatestVersions[packageName].gitHead
    });
  },
  tagList: require('./git').tagList()
});


module.exports = {
  mock: function (npmState) {
    mockNpmLatestVersions = npmState.latestVersions;
  },
  restore: function () {
    mockNpmLatestVersions = {};
  },
  plugins: {
    "analyzeCommits": analyzeCommits,
    "getLastRelease": getLastRelease,
    "verifyRelease": noop
  },
  pre: srPre
};

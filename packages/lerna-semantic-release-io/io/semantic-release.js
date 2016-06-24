var srNormalize = require('semantic-release/dist/lib/plugins').normalize;

var verifyRelease = srNormalize({}, "semantic-release/dist/lib/plugin-noop");
var analyzeCommits = require('lerna-semantic-release-analyze-commits');
var lastReleaseNpm = srNormalize({}, "@semantic-release/last-release-npm");

var srPre = require('semantic-release/dist/pre');

module.exports = {
  plugins: {
    "analyzeCommits": analyzeCommits,
    "getLastRelease": lastReleaseNpm,
    "verifyRelease": verifyRelease
  },
  pre: srPre
};

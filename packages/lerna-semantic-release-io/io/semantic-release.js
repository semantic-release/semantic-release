var srNormalize = require('semantic-release/dist/lib/plugins').normalize;

var verifyRelease = srNormalize({}, "semantic-release/dist/lib/plugin-noop");
var analyzeCommits = require('lerna-semantic-release-analyze-commits').analyze;
var getLastRelease = require('lerna-semantic-release-get-last-release').bind(null, {
  lastReleaseNpm: require('@semantic-release/last-release-npm'),
  revParse: require('./git').revParse()
});

var srPre = require('semantic-release/dist/pre');

module.exports = {
  plugins: {
    "analyzeCommits": analyzeCommits,
    "getLastRelease": getLastRelease,
    "verifyRelease": verifyRelease
  },
  pre: srPre
};

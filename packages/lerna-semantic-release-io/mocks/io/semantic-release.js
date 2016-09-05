var mockNpmLatestVersions = {};
var mockGitState = {};

var mockery = require('mockery');

// We need to enable mockery initially so that semantic-release/dist/pre requires our mocked version
mockery.enable({
  warnOnUnregistered: false,
  useCleanCache: true
});
// For some reason using the clean cache doesn't work, we need to delete the cache entry too
delete require.cache[require.resolve('semantic-release/src/pre')];

mockery.registerMock('./lib/commits', function (_ref, cb) {
  const lastRelease = _ref.lastRelease;
  const logHashes = mockGitState.log.map((function (log) { return log.hash }));
  const indexOfLastReleaseCommit = logHashes.indexOf(lastRelease.gitHead);
  const commitsSinceLastRelease = mockGitState.log.slice(0, indexOfLastReleaseCommit);
  cb(null, commitsSinceLastRelease);
});

var getLastRelease = require('lerna-semantic-release-get-last-release').bind(null, {
  lastReleaseNpm: function (pluginConfig, _ref, cb) {
    const packageName = _ref.pkg.name;
    cb(null, {
      version: mockNpmLatestVersions[packageName].version,
      gitHead: mockNpmLatestVersions[packageName].gitHead
    });
  },
  revParse: require('./git').revParse(),
  tagList: require('./git').tagList()
});

var srNormalize = require('semantic-release/src/lib/plugins').normalize;
var srPre = require('semantic-release/src/pre');

var noop = srNormalize({}, 'semantic-release/src/lib/plugin-noop');
var analyzeCommits = require('lerna-semantic-release-analyze-commits').analyze;

module.exports = {
  mock: function (npmState, gitState) {
    mockNpmLatestVersions = npmState.latestVersions;
    mockGitState = gitState;
  },
  restore: function () {
    mockNpmLatestVersions = {};
    mockGitState = {};
  },
  plugins: {
    'analyzeCommits': analyzeCommits,
    'getLastRelease': getLastRelease,
    'verifyRelease': noop
  },
  pre: srPre
};

var commitAnalyzer = require('@semantic-release/commit-analyzer');
var log = require('../utils/log');

module.exports = {
  default: function (_ref, cb) {
    var pkg = _ref.pkg;
    var commits = _ref.commits;

    var relevantCommits = commits.filter(function (commit) {
      return module.exports.isRelevant(commit, pkg.name);
    });

    commitAnalyzer({}, Object.assign(_ref, {commits: relevantCommits}), function (err, type) {
      log.info('Anaylzed', relevantCommits.length, 'commits to determine type', type, 'for', pkg.name);
      relevantCommits.length && log.info('Commits:\n', relevantCommits.map(function (commit) {
        return commit.hash + ': ' + commit.message;
      }).join('\n----\n'));
      cb(err, type);
    });
  },

  isRelevant: function (commit, packageName) {
    var affectsLine = (commit && commit.message) ? commit.message.split('\n\n')[1] : '';
    return affectsLine && affectsLine.indexOf('affects:') === 0 && affectsLine.indexOf(packageName) > -1
  }
};

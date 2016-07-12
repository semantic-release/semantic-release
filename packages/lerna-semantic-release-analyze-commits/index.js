var commitAnalyzer = require('@semantic-release/commit-analyzer');
var log = require('lerna-semantic-release-utils').log;

module.exports = {
  analyze: function (_ref, cb) {
    var pkg = _ref.pkg;
    var commits = _ref.commits;

    var relevantCommits = commits.filter(function (commit) {
      var affectsLine = (commit && commit.message) ? commit.message.split('\n\n')[1] : '';
      return module.exports.isRelevant(affectsLine, pkg.name);
    });

    commitAnalyzer({}, Object.assign(_ref, {commits: relevantCommits}), function (err, type) {
      log.info('Anaylzed', relevantCommits.length, '/', commits.length, 'commits to determine type', type, 'for', pkg.name);
      relevantCommits.length && log.verbose('Commits:\n', relevantCommits.map(function (commit) {
        return commit.hash + ': ' + commit.message;
      }).join('\n----\n'));
      cb(err, type);
    });
  },

  isRelevant: function (affectsLine, packageName) {
    var affectsDelimiter = 'affects:';
    return affectsLine && affectsLine.indexOf(affectsDelimiter) === 0 &&
      affectsLine.split(affectsDelimiter)[1].trim().split(', ').indexOf(packageName) > -1;
  }
};

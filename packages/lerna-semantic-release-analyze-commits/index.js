var commitAnalyzer = require('@semantic-release/commit-analyzer');
var log = require('lerna-semantic-release-utils').log;
var affectsDelimiter = 'affects:';

function findAffectsLine(commit) {
  var message = (commit && commit.message) ? commit.message : '';
  var affectsLine = message.split('\n\n').filter(function (line) {
    return line.indexOf(affectsDelimiter) === 0;
  })[0];
  console.log(affectsLine);
  return affectsLine;
}

module.exports = {
  analyze: function (_ref, cb) {
    var pkg = _ref.pkg;
    var commits = _ref.commits;

    var relevantCommits = commits.filter(function (commit) {
      return module.exports.isRelevant(findAffectsLine(commit), pkg.name);
    });

    commitAnalyzer({}, Object.assign(_ref, {commits: relevantCommits}), function (err, type) {
      log.info('Anaylzed', relevantCommits.length, '/', commits.length, 'commits to determine type', type, 'for', pkg.name);
      relevantCommits.length && log.info('Relevant commits:\n* ', relevantCommits.map(function (commit) {
        return commit.hash;
      }).join('\n* '));
      cb(err, type);
    });
  },
  isRelevant: function (affectsLine, packageName) {
    return affectsLine && affectsLine.indexOf(affectsDelimiter) === 0 &&
      affectsLine.split(affectsDelimiter)[1].trim().split(', ').indexOf(packageName) > -1;
  }
};

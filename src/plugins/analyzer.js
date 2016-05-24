var commitAnalyzer = require('@semantic-release/commit-analyzer');

module.exports = function (_ref, cb) {
  var pkg = _ref.pkg;
  var commits = _ref.commits;

  var relevantCommits = commits.filter(function (commit) {
    var affectsLine = commit.message.split('\n\n')[1];
    return affectsLine && affectsLine.indexOf('affects:') === 0 && affectsLine.indexOf(pkg.name) > -1;
  });

  commitAnalyzer({}, Object.assign(_ref, {commits: relevantCommits}), function (err, type) {
    console.log('Anaylzed', relevantCommits.length, 'commits to determine type', type, 'for', pkg.name);
    cb(err, type);
  });
};

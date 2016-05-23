var lastRelease = require('@semantic-release/last-release-npm');
var shell = require('shelljs');

var makeTag = require('./utils/make-tag');

module.exports = function lastReleaseLerna (_ref, cb) {
  lastRelease({}, _ref, function (err, lastRelease) {
    if (!lastRelease.gitHead) {
      var tag = makeTag(_ref.pkg.name, lastRelease.version);
      var gitHead = shell.exec(['git rev-list -n 1', tag].join(' '));

      if (gitHead.code !== 0) {
        console.warn('Error: git head could not be calculated from the tag `' + tag + '`. Ensure this tag exists locally.');
        console.warn('Attempting to use the first commit instead');
        gitHead = shell.exec('git rev-list --max-parents=0 HEAD');
      }

      lastRelease.gitHead = gitHead.stdout.trim();
    }

    cb(null, lastRelease);
  });
};
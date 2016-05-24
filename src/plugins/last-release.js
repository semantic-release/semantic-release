/*
 This is only necessary because package.json's gitHead isn't always populated with lerna. See
 https://github.com/npm/read-package-json/issues/66
 For that reason we can't use @semantic-release/last-release-npm, otherwise we'd directly use that plugin
 */
var shell = require('shelljs');
var makeTag = require('../utils/make-tag');

module.exports = function lastReleaseLerna (_ref, cb) {
  var tag = makeTag(_ref.pkg.name, _ref.pkg.version);
  console.log('Finding the last release by searching looking for tag:', tag);
  var gitHead = shell.exec(['git rev-list -n 1', tag].join(' '));

  if (gitHead.code !== 0) {
    console.warn('Error: git head could not be calculated from the tag `' + tag + '`. Ensure this tag exists locally.');
    console.warn('Attempting to use the first commit instead');
    gitHead = shell.exec('git rev-list --max-parents=0 HEAD');
  }

  cb(null, {
    version: _ref.pkg.version,
    gitHead: gitHead.stdout.trim()
  });
};
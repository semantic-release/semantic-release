var conventionalChangelog = require('conventional-changelog');
var async = require('async');
var shell = require('shelljs');
var fs = require('fs');

var analyzer = require('./plugins/analyzer');

var CHANGELOG_FILE_NAME = 'CHANGELOG.md';

function createChangelog (done) {
  var writeStream = fs.createWriteStream(CHANGELOG_FILE_NAME, {flags: 'a'});
  var stream = conventionalChangelog({
    preset: 'angular',
    transform: function (commit, cb) {
      if (analyzer.isRelevant(commit.body, JSON.parse(fs.readFileSync(('./package.json'))).name)) {
        cb(null, commit);
      } else {
        cb(null, null);
      }
    }
  }).pipe(writeStream);

  stream.on('close', function () {
    done(null);
  });
}
module.exports = function () {
  async.series([
    createChangelog
  ],function (err) {
    if (err) {
      console.log(err);
    }
  });

};
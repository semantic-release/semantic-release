var shell = require('shelljs');
var fs = require('fs');
var path = require('path');

var TIMEOUT = 100;

function doesFileExist (path) {
  try {
    fs.statSync(path)
  } catch (e) {
    return false;
  }
  return true;
}

function makePollFunction (root, command, done) {
  return function () {
    var lock = path.join(root, '.git/index.lock');
    if (!doesFileExist(lock)) {
      shell.exec('git ' + command, done);
    } else {
      setTimeout(makePollFunction(root, command, done), TIMEOUT);
    }
  }
}

module.exports = function execGitConcurrent (command, done) {
  var root = shell.exec('git rev-parse --show-toplevel').stdout.trim();
  setTimeout(makePollFunction(root, command, done), TIMEOUT);
};
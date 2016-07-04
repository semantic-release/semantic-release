var shell = require('shelljs');
var execAsTask = require('lerna-semantic-release-utils').execAsTask;
var processCwd = require('process').cwd;

module.exports = {
  pushdSync: function pushd (path) {
    shell.pushd(path);
  },
  popdSync: function popd () {
    shell.popd();
  },
  touch: function touch (file) {
    return execAsTask('touch ' + file);
  },
  cwdSync: function cwd () {
    return processCwd();
  },
  lnSync: function ln (to, from) {
    shell.exec('ln -sf ' + to + ' ' + from);
  },
  unlinkSync: function unlink (file) {
    shell.exec('unlink ' + file);
  }
};

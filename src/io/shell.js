var shell = require('shelljs');
var execAsTask = require('../utils/exec-as-task');

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
  cwd: '',
  ln: '',
  unlink: ''
};

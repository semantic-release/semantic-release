var execAsTask = require('../utils/exec-as-task');

module.exports = {
  publish: '',
  version: function version (v) {
    return execAsTask('npm version ' + v + ' --git-tag-version false')
  },
  getVersion: ''
};

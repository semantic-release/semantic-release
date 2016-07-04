var sinon = require('sinon');
var sandbox = sinon.sandbox.create();
var makeMockTask = require('../make-mock-task');

module.exports = {
  _state: {},
  mock: function (npmState) {
    module.exports._state = npmState;
  },
  restore: function () {
    module.exports._state = {};
    module.exports.publish.resetTask();
    module.exports.version.resetTask();
  },
  publish: makeMockTask(sandbox),
  version: makeMockTask(sandbox),
  getVersion: function getVersion (packageName) {
    return function (done) {
      done(null, module.exports._state.versions[packageName]);
    }
  }
};

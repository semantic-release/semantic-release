var sinon = require('sinon');
var sandbox = sinon.sandbox;
var makeMockTask = require('../make-mock-task');

module.exports = {
  _state: {},
  mock: function (gitState) {
    module.exports._state = gitState;
    sandbox.create();
  },
  restore: function () {
    module.exports._state = {};
    module.exports.tag.resetTask();
    module.exports.tagDelete.resetTask();
    module.exports.commit.resetTask();
    module.exports.push.resetTask();
    module.exports.pushTags.resetTask();
    module.exports.add.resetTask();
  },
  tag: makeMockTask(sandbox),
  tagDelete: makeMockTask(sandbox),
  tagList: function tagList () {
    return function (done) {
      done(null, {
        all: module.exports._state.allTags
      })
    };
  },
  commit: makeMockTask(sandbox),
  head: function (done) {
    done(null, module.exports._state.head)
  },
  push: makeMockTask(sandbox),
  pushTags: makeMockTask(sandbox),
  add: makeMockTask(sandbox)
};

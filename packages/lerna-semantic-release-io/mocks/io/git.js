var sinon = require('sinon');
var sandbox = sinon.sandbox;
var makeMockTask = require('../make-mock-task');
var mockery = require('mockery');
var stream = require('stream');

//We need to enable mockery initially so that conventional-changelog-core requires our mocked version
mockery.enable({
  warnOnUnregistered: false
});

var mockGitLog = [];

function formatCommit (mockCommit) {
  var tagsSection = (mockCommit.tags ? '(tag: ' + mockCommit.tags + ')\n' : '');
  return mockCommit.message + '\n\n-hash-\n' +
    mockCommit.hash + '\n-gitTags-\n' + tagsSection + '-committerDate-\n' + mockCommit.date;
}

mockery.registerMock('git-raw-commits', function () {
  var readable = new stream.Readable();
  readable._read = function() {};
  mockGitLog.forEach(function (commit) {
    readable.push(new Buffer(formatCommit(commit)));
  });
  readable.push(null);
  readable.emit('close');
  return readable;
});

module.exports = {
  _state: {},
  mock: function (gitState) {
    mockery.enable({
      warnOnUnregistered: false
    });
    mockGitLog = gitState.log;
    module.exports._state = gitState;
    sandbox.create();
  },
  restore: function () {
    mockery.disable();
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
        all: module.exports._state.allTags.map((tagAndHash) => tagAndHash.tag)
      });
    };
  },
  revParse: function revParse () {
    return function (tagToMatch, done) {
      const matchingTagAndHash = module.exports._state.allTags.filter(function (t) { return t.tag === tagToMatch })[0];
      const matchFound = matchingTagAndHash && matchingTagAndHash.hash;
      done(null,  matchFound ? matchingTagAndHash.hash : 'tagnotfound');
    }
  },
  commit: makeMockTask(sandbox),
  head: function (done) {
    done(null, module.exports._state.head)
  },
  push: makeMockTask(sandbox),
  pullTags: makeMockTask(sandbox),
  pushTags: makeMockTask(sandbox),
  add: makeMockTask(sandbox)
};

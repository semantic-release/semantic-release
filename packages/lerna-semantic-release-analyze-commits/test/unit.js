var expect = require('expect.js');
var analyzeCommits = require('../index');

describe('analyzing commits', function() {
  it('detects the correct fix version when the commit has two lines', function (done) {
    var commit = {"hash":"6fcf2d","message":"fix(package): first line\n\nsecond line.\n\naffects: pkg-a, pkg-b, pkg-c\n"};

    analyzeCommits.analyze({
      pkg: {name: 'pkg-b'},
      commits: [commit],
    }, function(err, type) {
      expect(err).to.equal(null);
      expect(type).to.equal('patch');
      done();
    });
  });
  it('detects the correct fix version when the commit has one line', function (done) {
    var commit = {"hash":"6fcf2d","message":"fix(package): first line\n\naffects: pkg-a, pkg-b, pkg-c\n"};

    analyzeCommits.analyze({
      pkg: {name: 'pkg-b'},
      commits: [commit],
    }, function(err, type) {
      expect(err).to.equal(null);
      expect(type).to.equal('patch');
      done();
    });
  });
  describe('acts like semantic release', function () {
    var commits = [
      {"hash":"abcde4","message":"fix(package): first line\n\naffects: pkg-a\n"},
      {"hash":"abcde3","message":"feat(package): first line\n\naffects: pkg-a, pkg-b\n"},
      {"hash":"abcde2","message":"fix(package): first line\n\nBREAKING CHANGE: something\n\naffects: pkg-d\n"},
      {"hash":"abcde1","message":"chore(package): first line\n\naffects: pkg-a, pkg-b, pkg-c\n"},
    ];
    function expectType(packageName, expectedType, cb) {
      analyzeCommits.analyze({
        pkg: {name: packageName},
        commits: commits,
      }, function(err, type) {
        expect(err).to.equal(null);
        expect(type).to.equal(expectedType);
        cb();
      });
    }
    it('chore + feat = minor', function(done) {
      expectType('pkg-b', 'minor', done);
    });
    it('chore + feat + fix = minor', function(done) {
      expectType('pkg-a', 'minor', done);
    });
    it('chore = null', function(done) {
      expectType('pkg-b', 'minor', done);
    });
    it('break = major', function(done) {
      expectType('pkg-d', 'major', done);
    });
  });
  //TODO: I think this test *should* pass but it does not.
  //See https://github.com/atlassian/lerna-semantic-release/issues/33
  it.skip('still detects changes after revert', function (done) {
    var commits = [
      {"hash":"abcdef","message":"Revert \"fix(package): first line\"\n\nThis reverts commit 6fcf2d.\n"},
      {"hash":"6fcf2d","message":"fix(package): first line\n\naffects: pkg-a, pkg-b, pkg-c\n"},
    ];

    analyzeCommits.analyze({
      pkg: {name: 'pkg-b'},
      commits: commits,
    }, function(err, type) {
      expect(err).to.equal(null);
      expect(type).to.equal('patch');
      done();
    });
  });
});
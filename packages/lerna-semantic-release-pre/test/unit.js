var io = require('lerna-semantic-release-io').mocks;
var expect = require('expect.js');
var path = require('path');
var pre = require('../index');

function isPatchReleaseCommit (commit, packageName) {
  var isPatchReleaseCommit = true;
  var commitParts = commit.split('\n\n');

  isPatchReleaseCommit = isPatchReleaseCommit && commitParts[0].indexOf('chore') === 0;
  isPatchReleaseCommit = isPatchReleaseCommit && commitParts[1].indexOf('affects: ' + packageName + '@0.0.1') === 0;
  isPatchReleaseCommit = isPatchReleaseCommit && commitParts[2].indexOf('Released from sha FOO') === 0;
  return isPatchReleaseCommit;
}

describe('pre with three packages', function() {
  beforeEach(function () {
    var packageVersions = {
      versions: {
        'a': '0.0.0',
        'b': '0.0.0',
        'c': '0.0.0'
      }
    };

    io.mock({
      fs: {
        'packages': {
          'a': {
            'index.js': 'Unmodified',
            'package.json': JSON.stringify({name: 'a', version: '0.0.0'})
          },
          'b': {
            'index.js': 'Unmodified',
            'package.json': JSON.stringify({name: 'b', version: '0.0.0'})
          },
          'c': {
            'index.js': 'Unmodified',
            'package.json': JSON.stringify({name: 'c', version: '0.0.0'})
          }
        },
        'package.json': JSON.stringify({name: 'main', version: '0.0.0'}),
        'lerna.json': JSON.stringify({lerna: '2.0.0-beta.17', version: 'independent'})
      },
      git: {
        allTags: [
          'a@0.0.0',
          'b@0.0.0',
          'c@0.0.0'
        ],
        head: 'FOO'
      },
      npm: packageVersions,
      lerna: packageVersions
    });
  });

  afterEach(function () {
    io.restore();
  });

  describe('executing', function() {
    beforeEach(function (done) {
      pre({
        io: io,
        callback: done
      });
    });

    it('should not modify the main package.json', function () {
      expect(JSON.parse(io.fs.readFileSync('./package.json')).version).to.equal('0.0.0');
    });

    it('should not publish at all', function () {
      expect(io.npm.publish.innerTask.called).to.equal(false);
    });

    it('should set the npm version 3 times', function () {
      expect(io.npm.version.innerTask.callCount).to.equal(3);
    });

    it('should make 3 git commits', function () {
      expect(io.git.commit.innerTask.callCount).to.equal(3);
      expect(isPatchReleaseCommit(io.git.commit.firstCall.args[0], 'a')).to.equal(true);
      expect(isPatchReleaseCommit(io.git.commit.secondCall.args[0], 'b')).to.equal(true);
      expect(isPatchReleaseCommit(io.git.commit.thirdCall.args[0], 'c')).to.equal(true);
    });
  });
});

describe('pre with a private package', function() {
  beforeEach(function () {
    var packageVersions = {
      versions: {
        'a': '1.0.0',
      },
      latestVersions: {
        'a': {
          version: '1.0.0',
          gitHead: 'BREAK'
        }
      }
    };

    io.mock({
      fs: {
        'packages': {
          'a': {
            'index.js': 'Private!',
            'package.json': JSON.stringify({name: 'a', version: '1.0.0', 'private': true})
          }
        },
        'package.json': JSON.stringify({name: 'main', version: '0.0.0'}),
        'lerna.json': JSON.stringify({lerna: '2.0.0-beta.17', version: 'independent'})
      },
      git: {
        allTags: [
          'a@1.0.0'
        ],
        head: 'FOO',
        log: [{
            message: 'fix: a\n\naffects: a\n\nThis is not a breaking change',
            hash: 'FOO',
            date: '2015-08-22 12:01:42 +0200'
          },
          {
            message: 'fix: a\n\naffects: a\n\nBREAKING CHANGE: this is a breaking change, for testing',
            hash: 'BREAK',
            date: '2015-08-22 12:01:42 +0200',
            tags: '1.0.0'
          }
        ]
      },
      npm: packageVersions,
      lerna: packageVersions
    });
  });

  afterEach(function () {
    io.restore();
  });

  describe('executing', function() {
    beforeEach(function (done) {
      pre({
        io: io,
        callback: done
      });
    });

    it('should not modify the main package.json', function () {
      expect(JSON.parse(io.fs.readFileSync('./package.json')).version).to.equal('0.0.0');
    });

    it('should not publish at all', function () {
      expect(io.npm.publish.innerTask.called).to.equal(false);
    });

    it('should set the npm version 1 time', function () {
      expect(io.npm.version.innerTask.callCount).to.equal(1);
    });

    it('should make 1 git commit', function () {
      expect(io.git.commit.innerTask.callCount).to.equal(1);
      expect(isPatchReleaseCommit(io.git.commit.firstCall.args[0], 'a')).to.equal(true);
    });

    it.only('should leave the version as 1.0.1', function () {
      expect(JSON.parse(io.fs.readFileSync('packages/a/package.json')).version).to.equal('1.0.1');
    });
  });
});

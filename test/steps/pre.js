var io = require('../mocks/io');
var expect = require('expect.js');
var pre = require('../../src/pre');

describe('pre', function() {
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

  function isPatchReleaseCommit (commit, packageName) {
    var isPatchReleaseCommit = true;
    var commitParts = commit.split('\n\n');

    isPatchReleaseCommit = isPatchReleaseCommit && commitParts[0].indexOf('chore') === 0;
    isPatchReleaseCommit = isPatchReleaseCommit && commitParts[1].indexOf('affects: ' + packageName + '@0.0.1') === 0;
    isPatchReleaseCommit = isPatchReleaseCommit && commitParts[2].indexOf('Released from sha FOO') === 0;
    return isPatchReleaseCommit;
  }

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

  it('should work even if there is no callback given', () => {
    pre({ io: io });
  });
});

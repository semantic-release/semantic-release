var io = require('../mocks/io');
var expect = require('expect.js');
var path = require('path');
var perform = require('../../src/perform');

describe('perform', function() {
  beforeEach(function () {
    var fsState = {
      'packages': {
        'a': {
          'index.js': 'Modified',
          'package.json': JSON.stringify({name: 'a', version: '0.0.1'})
        },
        'b': {
          'index.js': 'Modified',
          'package.json': JSON.stringify({name: 'b', version: '0.0.1'})
        },
        'c': {
          'index.js': 'Unmodified',
          'package.json': JSON.stringify({name: 'c', version: '0.0.0'})
        }
      },
      'package.json': JSON.stringify({name: 'main', version: '0.0.0'}),
      'lerna.json': JSON.stringify({lerna: '2.0.0-beta.17', version: 'independent'})
    };

    io.mock({
      fs: fsState,
      git: {
        allTags: [
          'a@0.0.0',
          'b@0.0.0',
          'c@0.0.0'
        ],
        head: 'BAR'
      },
      npm: {
        versions: {
          'a': '0.0.0',
          'b': '0.0.0',
          'c': '0.0.0'
        }
      },
      lerna: {
        versions: {
          'a': '0.0.1',
          'b': '0.0.1',
          'c': '0.0.0'
        }
      }
    });
  });

  afterEach(function () {
    io.restore();
  });

  describe('executing', function () {
    beforeEach(function (done) {
      perform({
        io: io,
        callback: done
      });
    });

    it('npm publishes twice', function () {
      expect(io.npm.publish.innerTask.callCount).to.equal(2);
    });

    it('npm publishes a and b', function () {
      expect(io.npm.publish.firstCall.args[0]).to.equal('packages/a');
      expect(io.npm.publish.secondCall.args[0]).to.equal('packages/b');
    });

    it('writes a file recording published packages', function () {
      var fileContents = io.fs.readFileSync('./.released-packages').toString().split('\n');
      expect(fileContents.length).to.equal(2);
      expect(fileContents[0]).to.equal('a@0.0.1');
      expect(fileContents[1]).to.equal('b@0.0.1');
    });

    it('writes a file recording published packages', function () {
      var fileContents = io.fs.readFileSync('./.released-packages').toString().split('\n');
      expect(fileContents.length).to.equal(2);
      expect(fileContents[0]).to.equal('a@0.0.1');
      expect(fileContents[1]).to.equal('b@0.0.1');
    });

    it('pushes commits', function () {
      expect(io.git.push.called).to.equal(true);
    });

    it('pushes tags', function () {
      expect(io.git.pushTags.called).to.equal(true);
    });
  });

  it('should work even if there is no callback given', () => {
    perform({ io: io });
  });
});

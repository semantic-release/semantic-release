var io = require('lerna-semantic-release-io').mocks;
var expect = require('expect.js');
var path = require('path');
var perform = require('../index');

describe('perform', function() {
  describe('with three pakcages set up', function () {
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

    describe('when npm publish fails', function () {
      const oldNpmPublish = io.npm.publish;
      beforeEach(function (done) {
        io.npm.publish = function () {
          return function failNpmPublish(cb) {
            var error = Object.create(Error.prototype);
            error.message = 'Mock error for npm publish';
            cb(error);
          };
        };

        perform({
          io: io,
          callback: done
        });
      });

      afterEach(function() {
        io.npm.publish = oldNpmPublish;
      });

      it('does not write to the released packages file', function () {
        var fileContents = io.fs.readFileSync('./.released-packages').toString();
        expect(fileContents.trim().length).to.equal(0);
      });
    });

    describe('executing perform', function () {
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

      it('pushes commits', function () {
        expect(io.git.push.called).to.equal(true);
      });

      it('pushes tags', function () {
        expect(io.git.pushTags.called).to.equal(true);
      });
    });
  });

  describe('with a private package set up', function () {
    beforeEach(function () {
      var fsState = {
        'packages': {
          'private': {
            'index.js': 'Private!',
            'package.json': JSON.stringify({name: 'private', version: '0.0.1', 'private': true})
          }
        },
        'package.json': JSON.stringify({name: 'main', version: '0.0.0'}),
        'lerna.json': JSON.stringify({lerna: '2.0.0-beta.17', version: 'independent'})
      };

      io.mock({
        fs: fsState,
        git: {
          allTags: [
            'private@0.0.0'
          ],
          head: 'BAR'
        },
        npm: {
          versions: {
            'private': '0.0.0'
          }
        },
        lerna: {
          versions: {
            'private': '0.0.1'
          }
        }
      });
    });

    afterEach(function () {
      io.restore();
    });

    describe('executing perform', function () {
      beforeEach(function (done) {
        perform({
          io: io,
          callback: done
        });
      });

      it('npm publish is not called', function () {
        expect(io.npm.publish.innerTask.callCount).to.equal(0);
      });
    });

  });
});

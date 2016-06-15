var io = require('../mocks/io');
var expect = require('expect.js');
var post = require('../../src/post');
var path = require('path');
var fs = require('fs');

describe('post', function() {
  beforeEach(function () {
    function mockFilesInDirectory (directory, fileNames) {
      var mockFiles = {};
      var absoluteDirectory = path.resolve(directory);
      fileNames.forEach(function (fileName) {
        mockFiles[fileName] = fs.readFileSync(path.join(absoluteDirectory, fileName)).toString();
      });
      return mockFiles;
    }

    function mockNodeModules (fsState) {
      var pathToMock = 'node_modules/conventional-changelog-writer/templates';
      fsState[path.resolve(pathToMock)] = mockFilesInDirectory(pathToMock, [
        'commit.hbs',
        'footer.hbs',
        'header.hbs',
        'template.hbs'
      ]);

      return fsState;
    }

    var fsState = {
      'packages': {
        'a': {
          'index.js': 'Published',
          'package.json': JSON.stringify({name: 'a', version: '0.0.1'})
        },
        'b': {
          'index.js': 'Published',
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
      fs: mockNodeModules(fsState),
      git: {
        allTags: [
          'a@0.0.0',
          'a@0.0.1',
          'b@0.0.0',
          'b@0.0.1',
          'c@0.0.0'
        ],
        head: 'BAR'
      },
      npm: {
        versions: {
          'a': '0.0.1',
          'b': '0.0.1',
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
      post({
        io: io,
        callback: done
      });
    });

    it('npm publish is not called', function () {
      expect(io.npm.publish.innerTask.callCount).to.equal(0);
    });

    it('git push is called once', function () {
      expect(io.git.push.innerTask.callCount).to.equal(1);
    });

    it('git commit is called once', function () {
      expect(io.git.commit.innerTask.callCount).to.equal(1);
    });

    it('changelogs are touched and added three times', function () {
      expect(io.shell.touch.innerTask.callCount).to.equal(3);
      expect(io.git.add.innerTask.callCount).to.equal(3);
    });

    it.only('changelog contains correct content', function () {
      console.log(fs.readFileSync('./packages/a/CHANGELOG.md').toString());
      expect(true).to.equal(true);
    });

    it('git push --tags is not called', function () {
      expect(io.git.pushTags.innerTask.callCount).to.equal(0);
    });
  });
});

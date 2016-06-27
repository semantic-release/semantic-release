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
          'package.json': JSON.stringify({name: 'a', version: '0.0.2'})
        },
        'b': {
          'index.js': 'Published',
          'package.json': JSON.stringify({name: 'b', version: '0.0.1'})
        },
        'c': {
          'index.js': 'Unmodified',
          'package.json': JSON.stringify({name: 'c', version: '0.0.0'})
        },
        'd': {
          'index.js': 'Published',
          'package.json': JSON.stringify({name: 'd', version: '0.0.2', repository: { type: 'git', url: 'http://follow.me' }})
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
          'a@0.0.2',
          'b@0.0.0',
          'b@0.0.1',
          'c@0.0.0',
          'd@0.0.0',
          'd@0.0.1',
          'd@0.0.2'
        ],
        head: 'BAR',
        // Git tags are set up here for A's changelog, these would be modified at run time by git tag
        log: [
          {
            message: 'fix: a\n\naffects: a',
            hash: 'FOO',
            date: '2015-08-22 12:01:42 +0200',
            tags: '0.0.2'
          },
          {
            message: 'fix: a b\n\naffects: a, b',
            hash: 'BAR',
            date: '2015-08-22 12:01:42 +0200',
            tags: '0.0.1'
          },
          {
            message: 'fix: b\n\naffects: b',
            hash: 'BAZ',
            date: '2015-08-22 12:01:42 +0200'
          },
          {
            message: 'chore: does nothing',
            hash: 'BUZ',
            date: '2015-08-22 12:01:42 +0200',
            tags: '0.0.0'
          }
        ]
      },
      npm: {
        versions: {
          'a': '0.0.1',
          'b': '0.0.1',
          'c': '0.0.0',
          'd': '0.0.1'
        }
      },
      lerna: {
        versions: {
          'a': '0.0.1',
          'b': '0.0.1',
          'c': '0.0.0',
          'd': '0.0.1',
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

    it('changelogs are touched and added four times', function () {
      expect(io.shell.touch.innerTask.callCount).to.equal(4);
      expect(io.git.add.innerTask.callCount).to.equal(4);
    });

    function countOccurrences (s, regex) {
      return (s.match(regex) || []).length;
    }

    it('changelog contains correct content for package A', function () {
      var changeLog = fs.readFileSync('./packages/a/CHANGELOG.md').toString();
      expect(countOccurrences(changeLog, /<a name=/g)).to.equal(4);
      expect(countOccurrences(changeLog, /\* fix:/g)).to.equal(2);
      expect(countOccurrences(changeLog, /## 0.0.2/g)).to.equal(2);
      expect(countOccurrences(changeLog, /## 0.0.1/g)).to.equal(1);
      expect(countOccurrences(changeLog, /# 0.0.0/g)).to.equal(1);
      expect(countOccurrences(changeLog, /\* fix: b/g)).to.equal(0);
    });

    it('changelog contains correct URL package D', function () {
      var changeLog = fs.readFileSync('./packages/d/CHANGELOG.md').toString();

      expect(countOccurrences(changeLog, /\[FOO\]\(http:\/\/follow.me\/commits\/FOO\)/g)).to.equal(1);
      expect(countOccurrences(changeLog, /\[BAR\]\(http:\/\/follow.me\/commits\/BAR\)/g)).to.equal(1);
      expect(countOccurrences(changeLog, /\[BUZ\]\(http:\/\/follow.me\/commits\/BUZ\)/g)).to.equal(1);
    });

    it('git push --tags is not called', function () {
      expect(io.git.pushTags.innerTask.callCount).to.equal(0);
    });
  });
});

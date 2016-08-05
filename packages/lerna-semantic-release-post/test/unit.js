var io = require('lerna-semantic-release-io').mocks();
var realIo = require('lerna-semantic-release-io').default;
var expect = require('expect.js');
var path = require('path');
var post = require('../index');
var fs = require('fs');

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

function makeBasicState () {
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

  var packageVersions = {
    versions: {
      'a': '0.0.2',
      'b': '0.0.1',
      'c': '0.0.0',
      'd': '0.0.1',
    },
    latestVersions: {
      'a': {
        version: '0.0.2',
        gitHead: '3FIXA'
      },
      'b': {
        version: '0.0.1',
        gitHead: '2FIXAB'
      },
      'c': {
        version: '0.0.0',
        gitHead: 'FIRST'
      },
      'd': {
        version: '0.0.1',
        gitHead: 'FIRST'
      }
    }
  };

  return {
    fs: mockNodeModules(fsState),
    git: {
      allTags: [
        {tag: 'a@0.0.0', hash: 'FIRST'},
        {tag: 'a@0.0.1', hash: 'FIRST'},
        {tag: 'a@0.0.2', hash: '3FIXA'},
        {tag: 'b@0.0.0', hash: 'FIRST'},
        {tag: 'b@0.0.1', hash: '2FIXAB'},
        {tag: 'c@0.0.0', hash: 'FIRST'},
        {tag: 'd@0.0.0', hash: 'FIRST'},
        {tag: 'd@0.0.1', hash: 'FIRST'},
        {tag: 'd@0.0.2', hash: 'FIRST'}
      ],
      head: '3FIXA',
      // Git tags are set up here for A's changelog, these would be modified at run time by git tag
      log: [
        {
          message: 'fix: a\n\naffects: a',
          hash: '3FIXA',
          date: '2015-08-22 12:01:42 +0200',
          tags: '0.0.2'
        },
        {
          message: 'fix: a b\n\naffects: a, b',
          hash: '2FIXAB',
          date: '2015-08-22 12:01:42 +0200',
          tags: '0.0.1'
        },
        {
          message: 'fix: b\n\naffects: b',
          hash: '1FIXB',
          date: '2015-08-22 12:01:42 +0200'
        },
        {
          message: 'chore: the first commit',
          hash: 'FIRST',
          date: '2015-08-22 12:01:42 +0200',
          tags: '0.0.0'
        }
      ]
    },
    npm: packageVersions,
    lerna: packageVersions
  };
}

describe('post', function() {
  describe('with four packages', function() {
    beforeEach(function () {
      io.mock(makeBasicState());
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

        expect(countOccurrences(changeLog, /\[3FIXA\]\(http:\/\/follow.me\/commits\/3FIXA\)/g)).to.equal(1);
        expect(countOccurrences(changeLog, /\[2FIXAB\]\(http:\/\/follow.me\/commits\/2FIXAB\)/g)).to.equal(1);
        expect(countOccurrences(changeLog, /\[FIRST\]\(http:\/\/follow.me\/commits\/FIRST\)/g)).to.equal(1);
      });

      it('git push --tags is not called', function () {
        expect(io.git.pushTags.innerTask.callCount).to.equal(0);
      });
    });
  });

  describe('with a real rogue tag in the repo', function () {
    const rogueTagName = '0.0.1-semver-tag-that-does-not-follow-conventions';
    beforeEach(function (done) {
      /**
       *  A dependency of conventional changelog, `git-semver-tags` queries the `git log` *in the repo*
       *  directly. We cannot mock it. For that reason, we need to tag in the actual repo in this test
       */
      realIo.git.tag(rogueTagName)(done);
    });

    afterEach(function (done) {
      realIo.git.tagDelete([rogueTagName])(done);
    });

    describe('with a commit that does follow our conventions', function () {
      beforeEach(function () {
        var state = makeBasicState();
        state.git.allTags.push({
          tag: '0.0.1-semver-tag-for-rogue',
          hash: 'ROGUE',
        });
        state.git.log.push({
          message: 'chore(rogue): chore for rogue\n\naffects: rogue',
          hash: 'ROGUE',
          date: '2015-08-22 12:01:42 +0200',
          tags: '0.0.1-semver-tag-for-rogue'
        });
        io.mock(state);
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

        it('git push is called once', function () {
          expect(io.git.push.innerTask.callCount).to.equal(1);
        });
      });
    });
  });

});

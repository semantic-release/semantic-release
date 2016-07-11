var gitHead = require('git-head');
var execAsTask = require('lerna-semantic-release-utils').execAsTask;
var simpleGit = require('simple-git');

module.exports = {
  tag: function commit (tag, message) {
    return execAsTask('git tag -am"' + message + '" ' + tag)
  },
  tagDelete: function tagDelete (tags) {
    return execAsTask('git tag -d ' + tags.join(' '))
  },
  tagList: function tagList () {
    return function (done) {
      simpleGit().tags(done)
    };
  },
  revParse: function revParse () {
    return function (done) {
      simpleGit().revParse(done)
    }
  },
  commit: function commit (message) {
    return execAsTask('git commit -anm\'' + message +'\' --allow-empty');
  },
  head: gitHead,
  push: function push () {
    return execAsTask('git push origin');
  },
  pullTags: function pullTags () {
    return execAsTask('git pull --tags');
  },
  pushTags: function pushTags () {
    return execAsTask('git push origin --tags');
  },
  add: function add (file) {
    return execAsTask('git add ' + file);
  }
};

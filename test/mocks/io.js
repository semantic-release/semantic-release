module.exports = {
  fs: require('./io/fs'),
  git: require('./io/git'),
  lerna: require('./io/lerna'),
  npm: require('./io/npm'),
  shell: require('./io/shell'),
  semanticRelease: require('./io/semantic-release'),
  mock: function (state) {
    module.exports.fs.mock(state.fs);
    module.exports.git.mock(state.git);
    module.exports.lerna.mock(state.lerna);
    module.exports.npm.mock(state.npm);
    module.exports.shell.mock();
  },
  restore: function () {
    module.exports.fs.restore();
    module.exports.git.restore();
    module.exports.lerna.restore();
    module.exports.npm.restore();
    module.exports.shell.restore();
  }
};

module.exports = {
  fs: require('./fs'),
  git: require('./git'),
  lerna: require('./lerna'),
  npm: require('./npm'),
  shell: require('./shell'),
  semanticRelease: require('./semantic-release'),
  mock: function (state) {
    module.exports.fs.mock(state.fs);
    module.exports.git.mock(state.git);
    module.exports.lerna.mock(state.lerna);
    module.exports.npm.mock(state.npm);
    module.exports.shell.mock();
    module.exports.semanticRelease.mock(state.npm, state.git);
  },
  restore: function () {
    module.exports.fs.restore();
    module.exports.git.restore();
    module.exports.lerna.restore();
    module.exports.npm.restore();
    module.exports.shell.restore();
    module.exports.semanticRelease.restore();
  }
};

module.exports = function () {
  var ioMocks = {
    fs: require('./fs'),
    git: require('./git'),
    lerna: require('./lerna'),
    npm: require('./npm'),
    shell: require('./shell'),
    semanticRelease: require('./semantic-release'),
  };

  function mock (state) {
    ioMocks.fs.mock(state.fs);
    ioMocks.git.mock(state.git);
    ioMocks.lerna.mock(state.lerna);
    ioMocks.npm.mock(state.npm);
    ioMocks.shell.mock();
    ioMocks.semanticRelease.mock(state.npm, state.git);
  }

  function restore () {
    ioMocks.fs.restore();
    ioMocks.git.restore();
    ioMocks.lerna.restore();
    ioMocks.npm.restore();
    ioMocks.shell.restore();
    ioMocks.semanticRelease.restore();
  }

  return Object.assign(ioMocks, {mock: mock, restore: restore});
};

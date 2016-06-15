module.exports = {
  _state: {},
  mock: function (lernaState) {
    module.exports._state = lernaState;
  },
  restore: function () {
    module.exports._state = {};
  },
  getAllPackages: function () {
    return [
      {
        name: 'a',
        location: 'packages/a',
        version: module.exports._state.versions['a']
      },
      {
        name: 'b',
        location: 'packages/b',
        version: module.exports._state.versions['b']
      },
      {
        name: 'c',
        location: 'packages/c',
        version: module.exports._state.versions['c']
      }
    ]
  }
};

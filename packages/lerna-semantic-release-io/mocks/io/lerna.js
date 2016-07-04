var path = require('path');

module.exports = {
  _state: {},
  mock: function (lernaState) {
    module.exports._state = lernaState;
  },
  restore: function () {
    module.exports._state = {};
  },
  getAllPackages: function () {
    var state = module.exports._state;
    var names = Object.keys(state.versions);
    return names.map(function (name) {
      return {
        name: name,
        location: path.join('packages', name),
        version: state.versions[name]
      };
    });
  }
};

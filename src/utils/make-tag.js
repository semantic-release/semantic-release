module.exports = {
  lerna: function lerna (name, version) {
    return [name, '@', version].join('');
  },

  semantic: function semantic (name, version) {
    return [version, '-', name].join('');
  }
};

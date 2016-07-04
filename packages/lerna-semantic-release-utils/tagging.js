var semverSeparator = '-semver-tag-for-';

module.exports = {
  lerna: function lerna (name, version) {
    return [name, '@', version].join('');
  },

  semver: function semver (name, version) {
    return [version, semverSeparator, name].join('');
  },

  getTagParts: function getTagParts (tag) {
    if (tag.indexOf('@') > -1) {
      return {
        name: tag.split('@')[0],
        version: tag.split('@')[1]
      }
    }

    if (tag.indexOf(semverSeparator) > -1) {
      return {
        name: tag.split(semverSeparator)[1],
        version: tag.split(semverSeparator)[0]
      }
    }
  }
};

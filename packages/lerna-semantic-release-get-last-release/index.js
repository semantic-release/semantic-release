const getLastRelease = require('@semantic-release/last-release-npm');
const io = require('lerna-semantic-release-io');
const utils = require('lerna-semantic-release-utils');

module.exports = {
  getLastRelease: function (_ref, cb) {
    var pkg = _ref.pkg;
    utils.log.info('Using lerna-sr-get-last-release');

    if (pkg.private) {
      utils.log.info('Package', pkg.name, 'is marked as private, doing last version calculation locally');
      const version = pkg.version;
      io.git.tagList(function (tags) {
        const versionTag = utils.tagging.lerna(pkg.name, version);
        const versionGitHead = tags[versionTag];
        cb({
          version: version,
          gitHead: versionGitHead
        });
      });
    } else {
      getLastRelease({}, _ref, cb);
    }
  }
};

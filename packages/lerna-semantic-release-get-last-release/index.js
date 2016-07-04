const {log, tagging} = require('lerna-semantic-release-utils');

module.exports = function (pluginConfig, _ref, cb) {
  var pkg = _ref.pkg;
  const lastReleaseNpm = pluginConfig.lastReleaseNpm;
  const tagList = pluginConfig.tagList;

  if (pkg.private) {
    log.info('Package', pkg.name, 'is marked as private, doing last version calculation locally');
    const version = pkg.version;
    tagList(function (err, tags) {
      const versionTag = tagging.lerna(pkg.name, version);
      const versionGitHead = tags[versionTag];
      cb({
        version: version,
        gitHead: versionGitHead
      });
    });
  } else {
    lastReleaseNpm({}, _ref, cb);
  }
};

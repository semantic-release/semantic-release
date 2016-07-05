const {log, tagging} = require('lerna-semantic-release-utils');

module.exports = function (pluginConfig, _ref, cb) {
  var pkg = _ref.pkg;
  const lastReleaseNpm = pluginConfig.lastReleaseNpm;
  const revParse = pluginConfig.revParse;

  if (pkg.private) {
    log.info('Package', pkg.name, 'is marked as private, doing last version calculation locally');
    const version = pkg.version;
    const versionTag = tagging.lerna(pkg.name, version);
    revParse(versionTag, function (err, versionGitHead) {
      log.info(versionGitHead);
      cb(err, {
        version: version,
        gitHead: versionGitHead
      });
    });
  } else {
    lastReleaseNpm({}, _ref, cb);
  }
};

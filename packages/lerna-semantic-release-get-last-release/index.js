const utils = require('lerna-semantic-release-utils');
const log = utils.log;
const tagging = utils.tagging;

module.exports = function (pluginConfig, _ref, cb) {
  var pkg = _ref.pkg;
  const lastReleaseNpm = pluginConfig.lastReleaseNpm;
  const revParse = pluginConfig.revParse;
  const tagList = pluginConfig.tagList;

  if (pkg.private) {
    log.info('Package', pkg.name, 'is marked as private, doing last version calculation locally');
    const version = pkg.version;
    const versionTag = tagging.lerna(pkg.name, version);

    tagList(function (err, tags) {
      if (tags && tags.all.indexOf(versionTag) === -1) {
        log.info(`Tag ${versionTag} not found, so no last release detected`);
        cb(null, {});
        return;
      }

      revParse([versionTag], function (err, versionGitHead) {
        log.info(versionGitHead);
        cb(err, {
          version: version,
          gitHead: versionGitHead
        });
      });
    });


  } else {
    lastReleaseNpm({}, _ref, cb);
  }
};

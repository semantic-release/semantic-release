const {promisify} = require('util');
const {assign} = require('lodash');
const semver = require('semver');

const getCommits = require('./lib/get-commits');
const getReleaseType = require('./lib/get-release-type');

module.exports = async config => {
  const {getLastRelease, verifyRelease} = config.plugins;

  const lastRelease = await promisify(getLastRelease)(config);
  const commits = await getCommits(assign({lastRelease}, config));
  const type = await getReleaseType(assign({commits, lastRelease}, config));

  const nextRelease = {
    type: type,
    version: type === 'initial' ? '1.0.0' : semver.inc(lastRelease.version, type),
  };

  await verifyRelease(assign({commits, lastRelease, nextRelease}, config));

  return nextRelease;
};

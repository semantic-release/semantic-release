const {isFunction, union, template} = require('lodash');
const semver = require('semver');
const hideSensitive = require('./hide-sensitive');

function extractErrors(err) {
  return err && isFunction(err[Symbol.iterator]) ? [...err] : [err];
}

function hideSensitiveValues(env, objs) {
  const hideFunction = hideSensitive(env);
  return objs.map((object) => {
    Object.getOwnPropertyNames(object).forEach((prop) => {
      if (object[prop]) {
        object[prop] = hideFunction(object[prop]);
      }
    });
    return object;
  });
}

function tagsToVersions(tags) {
  return tags.map(({version}) => version);
}

function isMajorRange(range) {
  return /^\d+\.x(?:\.x)?$/i.test(range);
}

function isMaintenanceRange(range) {
  return /^\d+\.(?:\d+|x)(?:\.x)?$/i.test(range);
}

function getUpperBound(range) {
  const result = semver.valid(range)
    ? range
    : ((semver.validRange(range) || '').match(/<(?<upperBound>\d+\.\d+\.\d+(-\d+)?)$/) || [])[1];

  return result
    ? // https://github.com/npm/node-semver/issues/322
      result.replace(/-\d+$/, '')
    : result;
}

function getLowerBound(range) {
  return ((semver.validRange(range) || '').match(/(?<lowerBound>\d+\.\d+\.\d+)/) || [])[1];
}

function highest(version1, version2) {
  return version1 && version2 ? (semver.gt(version1, version2) ? version1 : version2) : version1 || version2;
}

function lowest(version1, version2) {
  return version1 && version2 ? (semver.lt(version1, version2) ? version1 : version2) : version1 || version2;
}

function getLatestVersion(versions, {withPrerelease} = {}) {
  return versions.filter((version) => withPrerelease || !semver.prerelease(version)).sort(semver.rcompare)[0];
}

function getEarliestVersion(versions, {withPrerelease} = {}) {
  return versions.filter((version) => withPrerelease || !semver.prerelease(version)).sort(semver.compare)[0];
}

function getFirstVersion(versions, lowerBranches) {
  const lowerVersion = union(...lowerBranches.map(({tags}) => tagsToVersions(tags))).sort(semver.rcompare);
  if (lowerVersion[0]) {
    return versions.sort(semver.compare).find((version) => semver.gt(version, lowerVersion[0]));
  }

  return getEarliestVersion(versions);
}

function getRange(min, max) {
  return `>=${min}${max ? ` <${max}` : ''}`;
}

function makeTag(tagFormat, version) {
  return template(tagFormat)({version});
}

function isSameChannel(channel, otherChannel) {
  return channel === otherChannel || (!channel && !otherChannel);
}

module.exports = {
  extractErrors,
  hideSensitiveValues,
  tagsToVersions,
  isMajorRange,
  isMaintenanceRange,
  getUpperBound,
  getLowerBound,
  highest,
  lowest,
  getLatestVersion,
  getEarliestVersion,
  getFirstVersion,
  getRange,
  makeTag,
  isSameChannel,
};

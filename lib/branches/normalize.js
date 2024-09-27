import { isNil, sortBy } from "lodash-es";
import semverDiff from "semver-diff";
import { FIRST_RELEASE, RELEASE_TYPE } from "../definitions/constants.js";
import {
  getFirstVersion,
  getLatestVersion,
  getLowerBound,
  getRange,
  getUpperBound,
  highest,
  isMajorRange,
  lowest,
  tagsToVersions,
} from "../utils.js";

export function maintenance({ maintenance, release }) {
  return sortBy(
    maintenance.map(({ name, range, channel, ...rest }) => ({
      ...rest,
      name,
      range: range || name,
      channel: isNil(channel) ? name : channel,
    })),
    "range"
  ).map(({ name, range, tags, ...rest }, idx, branches) => {
    const versions = tagsToVersions(tags);
    // Find the lower bound based on Maintenance branches
    const maintenanceMin =
      // If the current branch has a major range (1.x or 1.x.x) and the previous doesn't
      isMajorRange(range) && branches[idx - 1] && !isMajorRange(branches[idx - 1].range)
        ? // Then the lowest bound is the upper bound of the previous branch range
          getUpperBound(branches[idx - 1].range)
        : // Otherwise the lowest bound is the lowest bound of the current branch range
          getLowerBound(range);
    // The actual lower bound is the highest version between the current branch last release and `maintenanceMin`
    const min = highest(getLatestVersion(versions) || FIRST_RELEASE, maintenanceMin);
    // Determine the first release of the default branch not present in any maintenance branch
    const base =
      (release[0] &&
        (getFirstVersion(tagsToVersions(release[0].tags), branches) ||
          getLatestVersion(tagsToVersions(release[0].tags)))) ||
      FIRST_RELEASE;
    // The upper bound is the lowest version between the `base` version and the upper bound of the current branch range
    const max = lowest(base, getUpperBound(range));
    const diff = semverDiff(min, max);
    return {
      ...rest,
      type: "maintenance",
      name,
      tags,
      range: getRange(min, max),
      accept: diff ? RELEASE_TYPE.slice(0, RELEASE_TYPE.indexOf(diff)) : [],
      mergeRange: getRange(maintenanceMin, getUpperBound(range)),
    };
  });
}

export function release({ release }) {
  if (release.length === 0) {
    return release;
  }

  // The initial lastVersion is the last release from the base branch of `FIRST_RELEASE` (1.0.0)
  let lastVersion = getLatestVersion(tagsToVersions(release[0].tags)) || FIRST_RELEASE;

  return release.map(({ name, tags, channel, ...rest }, idx) => {
    const versions = tagsToVersions(tags);
    // The new lastVersion is the highest version between the current branch last release and the previous branch lastVersion
    lastVersion = highest(getLatestVersion(versions), lastVersion);
    // The upper bound is:
    //  - None if the current branch is the last one of the release branches
    //  - Otherwise, The upper bound is the lowest version that is present on the current branch but none of the previous ones
    const bound =
      release.length - 1 === idx
        ? undefined
        : getFirstVersion(tagsToVersions(release[idx + 1].tags), release.slice(0, idx + 1));

    const diff = bound ? semverDiff(lastVersion, bound) : null;
    return {
      ...rest,
      channel: idx === 0 ? channel : isNil(channel) ? name : channel,
      tags,
      type: "release",
      name,
      range: getRange(lastVersion, bound),
      accept: bound ? RELEASE_TYPE.slice(0, RELEASE_TYPE.indexOf(diff)) : RELEASE_TYPE,
      main: idx === 0,
    };
  });
}

export function prerelease({ prerelease }) {
  return prerelease.map(({ name, prerelease, channel, tags, ...rest }) => {
    const preid = prerelease === true ? name : prerelease;
    return {
      ...rest,
      channel: isNil(channel) ? name : channel,
      type: "prerelease",
      name,
      prerelease: preid,
      tags,
    };
  });
}

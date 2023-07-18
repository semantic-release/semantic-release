import { isUndefined } from "lodash-es";
import semver from "semver";
import { isSameChannel, makeTag } from "./utils.js";

/**
 * Last release.
 *
 * @typedef {Object} LastRelease
 * @property {string} version The version number of the last release.
 * @property {string} gitHead The Git reference used to make the last release.
 * @property {string} gitTag The git tag associated with the last release.
 * @property {string} channel The channel on which of the last release was published.
 * @property {string} name The name of the last release.
 */

/**
 * Determine the Git tag and version of the last tagged release.
 *
 * - Filter out the branch tags that are not valid semantic version
 * - Sort the versions
 * - Retrieve the highest version
 *
 * @param {Object} context semantic-release context.
 * @param {Object} params Function parameters.
 * @param {Object} params.before Find only releases with version number lower than this version.
 *
 * @return {LastRelease} The last tagged release or empty object if none is found.
 */
export default ({ branch, options: { tagFormat } }, { before } = {}) => {
  const [{ version, gitTag, channels } = {}] = branch.tags
    .filter(
      (tag) =>
        ((branch.type === "prerelease" &&
          tag.channels.some((channel) => isSameChannel(branch.channel, channel)) &&
          semver
            .parse(tag.version)
            .prerelease.includes(branch.prerelease === true ? branch.name : branch.prerelease)) ||
          !semver.prerelease(tag.version)) &&
        (isUndefined(before) || semver.lt(tag.version, before))
    )
    .sort((a, b) => semver.rcompare(a.version, b.version));

  if (gitTag) {
    return { version, gitTag, channels, gitHead: gitTag, name: makeTag(tagFormat, version) };
  }

  return {};
};

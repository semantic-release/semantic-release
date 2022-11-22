import { intersection, uniqBy } from "lodash-es";
import semver from "semver";
import semverDiff from "semver-diff";
import getLastRelease from "./get-last-release.js";
import { getLowerBound, makeTag } from "./utils.js";

/**
 * Find releases that have been merged from from a higher branch but not added on the channel of the current branch.
 *
 * @param {Object} context semantic-release context.
 *
 * @return {Array<Object>} Last release and next release to be added on the channel of the current branch.
 */
export default (context) => {
  const {
    branch,
    branches,
    options: { tagFormat },
  } = context;

  const higherChannels = branches
    // Consider only releases of higher branches
    .slice(branches.findIndex(({ name }) => name === branch.name) + 1)
    // Exclude prerelease branches
    .filter(({ type }) => type !== "prerelease")
    .map(({ channel }) => channel || null);

  const versiontoAdd = uniqBy(
    branch.tags.filter(
      ({ channels, version }) =>
        !channels.includes(branch.channel || null) &&
        intersection(channels, higherChannels).length > 0 &&
        (branch.type !== "maintenance" || semver.gte(version, getLowerBound(branch.mergeRange)))
    ),
    "version"
  ).sort((a, b) => semver.compare(b.version, a.version))[0];

  if (versiontoAdd) {
    const { version, gitTag, channels } = versiontoAdd;
    const lastRelease = getLastRelease(context, { before: version });
    if (semver.gt(getLastRelease(context).version, version)) {
      return;
    }

    const type = lastRelease.version ? semverDiff(lastRelease.version, version) : "major";
    const name = makeTag(tagFormat, version);
    return {
      lastRelease,
      currentRelease: { type, version, channels, gitTag, name, gitHead: gitTag },
      nextRelease: {
        type,
        version,
        channel: branch.channel || null,
        gitTag: makeTag(tagFormat, version),
        name,
        gitHead: gitTag,
      },
    };
  }
};

import { intersection, isString, uniqBy } from "lodash-es";
import semver from "semver";
import getLastRelease from "./get-last-release.js";
import { getLowerBound, getVersionDiff, makeTag } from "./utils.js";

/**
 * Whether a branch name is a micromatch/glob pattern rather than a literal ref name.
 * Configured maintenance ranges like `+([0-9])?(.{+([0-9]),x}).x` must not be treated as channels.
 *
 * @param {string} name Branch name from `options.branches`.
 * @return {boolean} `true` when `name` looks like a glob/micromatch pattern.
 */
const isGlobName = (name) => /[*+?![\](){}|]/.test(name);

/**
 * Derive "higher" release channels from configured branch definitions (`options.branches`).
 * Unlike the live expanded branch list, configuration survives after a head branch is deleted
 * (e.g. GitHub "Automatically delete head branches" removing `next` right after merge).
 *
 * Returns `null` when the current branch cannot be resolved in config (maintenance / glob /
 * missing), so the caller can fall back to the live branch list.
 *
 * @param {Object} branch Current branch (normalized).
 * @param {Array<string|Object>} configuredBranches `options.branches`.
 * @return {Array<string|null>|null} Higher channels, or `null` to fall back.
 */
function higherChannelsFromConfig(branch, configuredBranches) {
  if (!configuredBranches || configuredBranches.length === 0 || branch.type === "maintenance") {
    return null;
  }

  const configured = configuredBranches.map((b) => (isString(b) ? { name: b } : b));
  const currentIdx = configured.findIndex(
    (b) => isString(b.name) && !isGlobName(b.name) && b.name === branch.name
  );

  if (currentIdx === -1) {
    return null;
  }

  return configured
    .slice(currentIdx + 1)
    .filter((b) => isString(b.name) && !isGlobName(b.name) && !b.prerelease)
    .map((b) => b.channel ?? b.name ?? null);
}

/**
 * Find releases that have been merged from a higher branch but not added on the channel of the current branch.
 *
 * @param {Object} context semantic-release context.
 *
 * @return {Array<Object>} Last release and next release to be added on the channel of the current branch.
 */
export default (context) => {
  const {
    branch,
    branches,
    options: { tagFormat, branches: configuredBranches },
  } = context;

  const higherChannels =
    higherChannelsFromConfig(branch, configuredBranches) ??
    branches
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

    const type = lastRelease.version ? getVersionDiff(lastRelease.version, version) : "major";
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

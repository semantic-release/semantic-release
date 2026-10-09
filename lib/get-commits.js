import debugCommits from "debug";
import { getCommits, getCommitsFiles } from "./git.js";
import { matchesPaths } from "./monorepo.js";

const debug = debugCommits("semantic-release:get-commits");

/**
 * Whether a commit may be attributed to one of the paths.
 *
 * A commit that git did not report, or whose parent is missing locally (the boundary of a shallow clone),
 * cannot be attributed to any path and is kept: dropping a commit silently suppresses a release, which is
 * worse than releasing on an unrelated change. A commit that does have its parent and changed no file is
 * genuinely empty and is dropped.
 *
 * @param {Object} commit The commit to test.
 * @param {Map<String, Object>} filesByHash The files of each commit.
 * @param {Array<String>} paths The resolved monorepo paths.
 *
 * @return {Boolean} `true` when the commit must be kept.
 */
function isCommitRelevant(commit, filesByHash, paths) {
  const attribution = filesByHash.get(commit.hash);

  if (!attribution || !attribution.hasParents) {
    return true;
  }

  return matchesPaths(attribution.files, paths);
}

/**
 * Retrieve the list of commits on the current branch since the commit sha associated with the last release, or all the commits of the current branch if there is no last released version.
 *
 * When the `monorepo` option is configured, only the commits affecting one of its paths are returned.
 *
 * @param {Object} context semantic-release context.
 *
 * @return {Promise<Array<Object>>} The list of commits on the branch `branch` since the last release.
 */
export default async ({
  cwd,
  env,
  lastRelease: { gitHead: from },
  nextRelease: { gitHead: to = "HEAD" } = {},
  logger,
  options,
}) => {
  if (from) {
    debug("Use from: %s", from);
  } else {
    logger.log("No previous release found, retrieving all commits");
  }

  const commits = await getCommits(from, to, { cwd, env });
  const paths = options?.monorepo?.paths ?? [];
  let result = commits;

  if (paths.length > 0) {
    const filesByHash = await getCommitsFiles(from, to, { cwd, env });

    if (filesByHash) {
      result = commits.filter((commit) => isCommitRelevant(commit, filesByHash, paths));
    } else {
      logger.log("The files changed by the commits could not be determined, all commits will be considered");
    }
  }

  if (result.length === commits.length) {
    logger.log(`Found ${commits.length} commits since last release`);
  } else {
    logger.log(
      `Found ${commits.length} commits since last release, ${result.length} of them affecting ${paths.join(", ")}`
    );
  }

  debug("Parsed commits: %o", result);
  return result;
};

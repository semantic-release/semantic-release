import debugCommits from "debug";
import { getCommits } from "./git.js";

const debug = debugCommits("semantic-release:get-commits");

/**
 * Retrieve the list of commits on the current branch since the commit sha associated with the last release, or all the commits of the current branch if there is no last released version.
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
}) => {
  if (from) {
    debug("Use from: %s", from);
  } else {
    logger.log("No previous release found, retrieving all commits");
  }

  const commits = await getCommits(from, to, { cwd, env });

  logger.log(`Found ${commits.length} commits since last release`);
  debug("Parsed commits: %o", commits);
  return commits;
};

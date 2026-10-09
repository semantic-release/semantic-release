import { getBranchState, getChangedFilesSinceRemote, verifyTagPush } from "./git.js";
import { decideOnFailedPush, PROCEED, SKIP, UNAUTHORIZED } from "./monorepo.js";

/** Messages logged when the release must not happen. */
const SKIP_MESSAGES = {
  "not-up-to-date": (branch) =>
    `The local branch ${branch} is behind the remote one, therefore a new version won't be published.`,
  undetermined: (branch) =>
    `The local branch ${branch} is behind the remote one and the missing changes could not be determined, therefore a new version won't be published.`,
  "path-affected": (branch, paths) =>
    `The local branch ${branch} is behind the remote one, with changes in ${paths.join(
      ", "
    )}, therefore a new version won't be published.`,
};

/** Messages logged when the release continues without a verified push access. */
const PROCEED_MESSAGES = {
  "up-to-date": (branch) =>
    `The local branch ${branch} could not be verified as pushable, but it is up to date with the remote one, therefore the release will continue.`,
  "path-unaffected": (branch, paths) =>
    `The local branch ${branch} is behind the remote one, but the missing changes are outside ${paths.join(
      ", "
    )}, therefore the release will continue.`,
};

/**
 * Decide whether a release may continue when the push verification failed.
 *
 * The verification fails both when the local branch is behind the remote one and when the credentials cannot
 * push to it, so the decision combines the state of the branch with the monorepo paths: only a branch that
 * moved outside of those paths is safe to ignore. Proceeding is additionally gated on a tag push probe, since
 * the release pushes tags.
 *
 * Logs the outcome, so the caller only has to act on the returned decision.
 *
 * @param {Object} context semantic-release context.
 * @param {Object} branchInfo The branch being released.
 * @param {String} branchInfo.repositoryUrl The authenticated repository URL.
 * @param {String} branchInfo.branch The branch to inspect.
 *
 * @return {Promise<String>} `PROCEED` when the release may continue, `SKIP` when it must not happen and `UNAUTHORIZED` when the failure is a permission problem.
 */
export default async ({ cwd, env, logger, options }, { repositoryUrl, branch }) => {
  const paths = options.monorepo?.paths ?? [];
  const { upToDate } = await getBranchState(repositoryUrl, branch, { cwd, env });

  // Only the "behind" case needs the remote diff: when up to date there is nothing missing to inspect, and
  // without paths configured the release is skipped anyway.
  const changedFiles =
    !upToDate && paths.length > 0 ? await getChangedFilesSinceRemote(repositoryUrl, branch, { cwd, env }) : undefined;

  const { decision, reason } = decideOnFailedPush({ upToDate, changedFiles, paths });

  if (decision === SKIP) {
    logger.log(SKIP_MESSAGES[reason](branch, paths));
    return SKIP;
  }

  if (decision === UNAUTHORIZED) {
    return UNAUTHORIZED;
  }

  if (!(await verifyTagPush(repositoryUrl, { cwd, env }))) {
    return UNAUTHORIZED;
  }

  logger.warn(PROCEED_MESSAGES[reason](branch, paths));
  return PROCEED;
};

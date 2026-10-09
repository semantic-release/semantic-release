import { isPlainObject, isString, template } from "lodash-es";
import AggregateError from "aggregate-error";
import { isGitRepo, verifyTagName } from "./git.js";
import getError from "./get-error.js";

export default async (context) => {
  const {
    cwd,
    env,
    options: { repositoryUrl, tagFormat, branches, monorepo },
  } = context;
  const errors = [];
  const isRepo = await isGitRepo({ cwd, env });

  if (!isRepo) {
    errors.push(getError("ENOGITREPO", { cwd }));
  } else if (!repositoryUrl) {
    errors.push(getError("ENOREPOURL"));
  } else if (repositoryUrl.startsWith("-")) {
    // A `repositoryUrl` beginning with `-` would be interpreted by `git` as a
    // command-line option rather than a URL, enabling argument injection.
    errors.push(getError("EINVALIDREPOURL", { repositoryUrl }));
  }

  // Verify that compiling the `tagFormat` produce a valid Git tag
  if (!(await verifyTagName(template(tagFormat, { evaluate: false, escape: false })({ version: "0.0.0" })))) {
    errors.push(getError("EINVALIDTAGFORMAT", context));
  }

  // Verify the `tagFormat` contains the variable `version` by compiling the `tagFormat` template
  // with a space as the `version` value and verify the result contains the space.
  // The space is used as it's an invalid tag character, so it's guaranteed to no be present in the `tagFormat`.
  if ((template(tagFormat, { evaluate: false, escape: false })({ version: " " }).match(/ /g) || []).length !== 1) {
    errors.push(getError("ETAGNOVERSION", context));
  }

  branches.forEach((branch) => {
    if (
      !((isString(branch) && branch.trim()) || (isPlainObject(branch) && isString(branch.name) && branch.name.trim()))
    ) {
      errors.push(getError("EINVALIDBRANCH", { branch }));
    }
  });

  // Verify that the `monorepo` option designates at least one path that can actually match a file. A path
  // that resolves to nothing would match every file, and a path containing a `..` segment can never match
  // one, since git reports paths relative to the root of the worktree. Either way the filtering would
  // silently stop working. Only checked inside a repository, where the option can be resolved.
  if (isRepo && monorepo) {
    const paths = Array.isArray(monorepo.paths) ? monorepo.paths : [];
    const hasUnmatchablePath = paths.some((path) => isString(path) && path.split("/").includes(".."));

    if (paths.length === 0 || hasUnmatchablePath) {
      errors.push(getError("EINVALIDMONOREPOPATH", context));
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
};

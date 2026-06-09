import { isPlainObject, isString, template } from "lodash-es";
import AggregateError from "aggregate-error";
import { isGitRepo, verifyTagName } from "./git.js";
import getError from "./get-error.js";

export default async (context) => {
  const {
    cwd,
    env,
    options: { repositoryUrl, tagFormat, branches },
  } = context;
  const errors = [];

  if (!(await isGitRepo({ cwd, env }))) {
    errors.push(getError("ENOGITREPO", { cwd }));
  } else if (!repositoryUrl) {
    errors.push(getError("ENOREPOURL"));
  }

  // Verify that compiling the `tagFormat` produce a valid Git tag
  if (!(await verifyTagName(template(tagFormat)({ version: "0.0.0" })))) {
    errors.push(getError("EINVALIDTAGFORMAT", context));
  }

  // Verify the `tagFormat` contains the variable `version` by compiling the `tagFormat` template
  // with a space as the `version` value and verify the result contains the space.
  // The space is used as it's an invalid tag character, so it's guaranteed to no be present in the `tagFormat`.
  if ((template(tagFormat)({ version: " " }).match(/ /g) || []).length !== 1) {
    errors.push(getError("ETAGNOVERSION", context));
  }

  branches.forEach((branch) => {
    if (
      !((isString(branch) && branch.trim()) || (isPlainObject(branch) && isString(branch.name) && branch.name.trim()))
    ) {
      errors.push(getError("EINVALIDBRANCH", { branch }));
    }
  });

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
};

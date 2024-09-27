import { isRegExp, isString } from "lodash-es";
import AggregateError from "aggregate-error";
import pEachSeries from "p-each-series";
import * as DEFINITIONS from "../definitions/branches.js";
import getError from "../get-error.js";
import { fetch, fetchNotes, verifyBranchName } from "../git.js";
import expand from "./expand.js";
import getTags from "./get-tags.js";
import * as normalize from "./normalize.js";

export default async (repositoryUrl, ciBranch, context) => {
  const { cwd, env } = context;

  const remoteBranches = await expand(
    repositoryUrl,
    context,
    context.options.branches.map((branch) => (isString(branch) || isRegExp(branch) ? { name: branch } : branch))
  );

  await pEachSeries(remoteBranches, async ({ name }) => {
    await fetch(repositoryUrl, name, ciBranch, { cwd, env });
  });

  await fetchNotes(repositoryUrl, { cwd, env });

  const branches = await getTags(context, remoteBranches);

  const errors = [];
  const branchesByType = Object.entries(DEFINITIONS).reduce(
    // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
    (branchesByType, [type, { filter }]) => ({ [type]: branches.filter(filter), ...branchesByType }),
    {}
  );

  const result = Object.entries(DEFINITIONS).reduce((result, [type, { branchesValidator, branchValidator }]) => {
    branchesByType[type].forEach((branch) => {
      if (branchValidator && !branchValidator(branch)) {
        errors.push(getError(`E${type.toUpperCase()}BRANCH`, { branch }));
      }
    });

    const branchesOfType = normalize[type](branchesByType);

    if (!branchesValidator(branchesOfType)) {
      errors.push(getError(`E${type.toUpperCase()}BRANCHES`, { branches: branchesOfType }));
    }

    return { ...result, [type]: branchesOfType };
  }, {});

  const duplicates = [...branches]
    .map((branch) => branch.name)
    .sort()
    .filter((_, idx, array) => array[idx] === array[idx + 1] && array[idx] !== array[idx - 1]);

  if (duplicates.length > 0) {
    errors.push(getError("EDUPLICATEBRANCHES", { duplicates }));
  }

  await pEachSeries(branches, async (branch) => {
    if (!(await verifyBranchName(branch.name))) {
      errors.push(getError("EINVALIDBRANCHNAME", branch));
    }
  });

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  return [...result.maintenance, ...result.release, ...result.prerelease];
};

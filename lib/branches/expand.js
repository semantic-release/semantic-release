import { isString, mapValues, omit, remove, template } from "lodash-es";
import micromatch from "micromatch";
import { getBranches } from "../git.js";

export default async (repositoryUrl, { cwd }, branches, includeTags = false) => {
  const gitBranches = await getBranches(repositoryUrl, { cwd });

  if (includeTags) {
    gitBranches.push(...(await Promise.all(gitBranches.map(gitBranch => getTags(gitBranch, { cwd })))).flat())
  }

  return branches.reduce(
    (branches, branch) => [
      ...branches,
      ...remove(gitBranches, (name) => micromatch(gitBranches, branch.name).includes(name)).map((name) => ({
        name,
        ...mapValues(omit(branch, "name"), (value) => (isString(value) ? template(value)({ name }) : value)),
      })),
    ],
    []
  );
};

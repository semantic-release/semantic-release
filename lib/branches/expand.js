import {isString, remove, omit, mapValues, template} from 'lodash';
import micromatch from 'micromatch';
import {getBranches} from '../git.js';

export default async (repositoryUrl, {cwd}, branches) => {
  const gitBranches = await getBranches(repositoryUrl, {cwd});

  return branches.reduce(
    (branches, branch) => [
      ...branches,
      ...remove(gitBranches, (name) => micromatch(gitBranches, branch.name).includes(name)).map((name) => ({
        name,
        ...mapValues(omit(branch, 'name'), (value) => (isString(value) ? template(value)({name}) : value)),
      })),
    ],
    []
  );
};

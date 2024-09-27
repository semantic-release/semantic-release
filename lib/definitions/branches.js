import { isNil, uniqBy } from "lodash-es";
import semver from "semver";
import { isMaintenanceRange } from "../utils.js";

export const maintenance = {
  filter: ({ name, range }) => (!isNil(range) && range !== false) || isMaintenanceRange(name),
  branchValidator: ({ range }) => (isNil(range) ? true : isMaintenanceRange(range)),
  branchesValidator: (branches) => uniqBy(branches, ({ range }) => semver.validRange(range)).length === branches.length,
};

export const prerelease = {
  filter: ({ prerelease }) => !isNil(prerelease) && prerelease !== false,
  branchValidator: ({ name, prerelease }) =>
    Boolean(prerelease) && Boolean(semver.valid(`1.0.0-${prerelease === true ? name : prerelease}.1`)),
  branchesValidator: (branches) => uniqBy(branches, "prerelease").length === branches.length,
};

export const release = {
  // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
  filter: (branch) => !maintenance.filter(branch) && !prerelease.filter(branch),
  branchesValidator: (branches) => branches.length <= 3 && branches.length > 0,
};

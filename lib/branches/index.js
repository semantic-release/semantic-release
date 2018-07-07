const {isString, isRegExp} = require('lodash');
const AggregateError = require('aggregate-error');
const pEachSeries = require('p-each-series');
const DEFINITIONS = require('../definitions/branches');
const getError = require('../get-error');
const {verifyBranchName} = require('../git');
const expand = require('./expand');
const getTags = require('./get-tags');
const normalize = require('./normalize');

module.exports = async context => {
  const branches = await getTags(
    context,
    await expand(
      context,
      context.options.branches.map(branch => (isString(branch) || isRegExp(branch) ? {name: branch} : branch))
    )
  );

  const errors = [];
  const branchesByType = Object.entries(DEFINITIONS).reduce(
    (branchesByType, [type, {filter}]) => ({[type]: branches.filter(filter), ...branchesByType}),
    {}
  );

  const result = Object.entries(DEFINITIONS).reduce((result, [type, {branchesValidator, branchValidator}]) => {
    branchesByType[type].forEach(branch => {
      if (branchValidator && !branchValidator(branch)) {
        errors.push(getError(`E${type.toUpperCase()}BRANCH`, {branch}));
      }
    });

    const branchesOfType = normalize[type](branchesByType);

    if (!branchesValidator(branchesOfType)) {
      errors.push(getError(`E${type.toUpperCase()}BRANCHES`, {branches: branchesOfType}));
    }

    return {...result, [type]: branchesOfType};
  }, {});

  const duplicates = [...branches]
    .map(branch => branch.name)
    .sort()
    .filter((val, idx, arr) => arr[idx] === arr[idx + 1] && arr[idx] !== arr[idx - 1]);

  if (duplicates.length > 0) {
    errors.push(getError('EDUPLICATEBRANCHES', {duplicates}));
  }

  await pEachSeries(branches, async branch => {
    if (!(await verifyBranchName(branch.name))) {
      errors.push(getError('EINVALIDBRANCHNAME', branch));
    }
  });

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  return [...result.maintenance, ...result.release, ...result.prerelease];
};

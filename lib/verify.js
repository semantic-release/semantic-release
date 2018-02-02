const {template} = require('lodash');
const AggregateError = require('aggregate-error');
const {isGitRepo, verifyAuth, verifyTagName} = require('./git');
const getError = require('./get-error');

module.exports = async (options, branch, logger) => {
  const errors = [];

  if (!await isGitRepo()) {
    errors.push(getError('ENOGITREPO'));
  } else if (!options.repositoryUrl) {
    errors.push(getError('ENOREPOURL'));
  } else if (!await verifyAuth(options.repositoryUrl, options.branch)) {
    errors.push(getError('EGITNOPERMISSION', {options}));
  }

  // Verify that compiling the `tagFormat` produce a valid Git tag
  if (!await verifyTagName(template(options.tagFormat)({version: '0.0.0'}))) {
    errors.push(getError('EINVALIDTAGFORMAT', {tagFormat: options.tagFormat}));
  }

  // Verify the `tagFormat` contains the variable `version` by compiling the `tagFormat` template
  // with a space as the `version` value and verify the result contains the space.
  // The space is used as it's an invalid tag character, so it's guaranteed to no be present in the `tagFormat`.
  if ((template(options.tagFormat)({version: ' '}).match(/ /g) || []).length !== 1) {
    errors.push(getError('ETAGNOVERSION', {tagFormat: options.tagFormat}));
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  if (branch !== options.branch) {
    logger.log(
      `This test run was triggered on the branch ${branch}, while semantic-release is configured to only publish from ${
        options.branch
      }, therefore a new version won’t be published.`
    );
    return false;
  }

  return true;
};

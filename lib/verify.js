const {template} = require('lodash');
const SemanticReleaseError = require('@semantic-release/error');
const AggregateError = require('aggregate-error');
const {isGitRepo, verifyAuth, verifyTagName} = require('./git');

module.exports = async (options, branch, logger) => {
  const errors = [];

  if (!await isGitRepo()) {
    logger.error('Semantic-release must run from a git repository.');
    return false;
  }

  if (!options.repositoryUrl) {
    errors.push(new SemanticReleaseError('The repositoryUrl option is required', 'ENOREPOURL'));
  } else if (!await verifyAuth(options.repositoryUrl, options.branch)) {
    errors.push(
      new SemanticReleaseError(
        `The git credentials doesn't allow to push on the branch ${options.branch}.`,
        'EGITNOPERMISSION'
      )
    );
  }

  // Verify that compiling the `tagFormat` produce a valid Git tag
  if (!await verifyTagName(template(options.tagFormat)({version: '0.0.0'}))) {
    errors.push(
      new SemanticReleaseError('The tagFormat template must compile to a valid Git tag format', 'EINVALIDTAGFORMAT')
    );
  }

  // Verify the `tagFormat` contains the variable `version` by compiling the `tagFormat` template
  // with a space as the `version` value and verify the result contains the space.
  // The space is used as it's an invalid tag character, so it's guaranteed to no be present in the `tagFormat`.
  if ((template(options.tagFormat)({version: ' '}).match(/ /g) || []).length !== 1) {
    errors.push(
      new SemanticReleaseError(
        `The tagFormat template must contain the variable "\${version}" exactly once`,
        'ETAGNOVERSION'
      )
    );
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

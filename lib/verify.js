const SemanticReleaseError = require('@semantic-release/error');
const {isGitRepo, verifyAuth} = require('./git');

module.exports = async (options, branch, logger) => {
  if (!await isGitRepo()) {
    logger.error('Semantic-release must run from a git repository.');
    return false;
  }

  if (!await verifyAuth(options.repositoryUrl, options.branch)) {
    throw new SemanticReleaseError(
      `The git credentials doesn't allow to push on the branch ${options.branch}.`,
      'EGITNOPERMISSION'
    );
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

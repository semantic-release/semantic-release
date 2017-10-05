const SemanticReleaseError = require('@semantic-release/error');

module.exports = (options, env) => {
  if (!options.githubToken) {
    throw new SemanticReleaseError('No github token specified.', 'ENOGHTOKEN');
  }

  if (!(env.NPM_TOKEN || (env.NPM_OLD_TOKEN && env.NPM_EMAIL))) {
    throw new SemanticReleaseError('No npm token specified.', 'ENONPMTOKEN');
  }
};

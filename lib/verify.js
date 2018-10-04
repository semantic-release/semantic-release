const {template} = require('lodash');
const AggregateError = require('aggregate-error');
const {isGitRepo, verifyTagName} = require('./git');
const getError = require('./get-error');

module.exports = async ({cwd, env, options: {repositoryUrl, tagFormat}}) => {
  const errors = [];

  if (!(await isGitRepo({cwd, env}))) {
    errors.push(getError('ENOGITREPO', {cwd}));
  } else if (!repositoryUrl) {
    errors.push(getError('ENOREPOURL'));
  }

  // Verify that compiling the `tagFormat` produce a valid Git tag
  if (!(await verifyTagName(template(tagFormat)({version: '0.0.0'})))) {
    errors.push(getError('EINVALIDTAGFORMAT', {tagFormat}));
  }

  // Verify the `tagFormat` contains the variable `version` by compiling the `tagFormat` template
  // with a space as the `version` value and verify the result contains the space.
  // The space is used as it's an invalid tag character, so it's guaranteed to no be present in the `tagFormat`.
  if ((template(tagFormat)({version: ' '}).match(/ /g) || []).length !== 1) {
    errors.push(getError('ETAGNOVERSION', {tagFormat}));
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
};

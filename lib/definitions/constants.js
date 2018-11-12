const RELEASE_TYPE = ['prerelease', 'prepatch', 'patch', 'preminor', 'minor', 'premajor', 'major'];

const FIRST_RELEASE = '1.0.0';

const COMMIT_NAME = 'semantic-release-bot';

const COMMIT_EMAIL = 'semantic-release-bot@martynus.net';

const RELEASE_NOTES_SEPARATOR = '\n\n';

const SECRET_REPLACEMENT = '[secure]';

const SECRET_MIN_SIZE = 5;

module.exports = {
  RELEASE_TYPE,
  FIRST_RELEASE,
  COMMIT_NAME,
  COMMIT_EMAIL,
  RELEASE_NOTES_SEPARATOR,
  SECRET_REPLACEMENT,
  SECRET_MIN_SIZE,
};

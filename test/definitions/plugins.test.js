const test = require('ava');
const plugins = require('../../lib/definitions/plugins');
const {RELEASE_NOTES_SEPARATOR, SECRET_REPLACEMENT} = require('../../lib/definitions/constants');

test('The "analyzeCommits" plugin output must be either undefined or a valid semver release type', (t) => {
  t.false(plugins.analyzeCommits.outputValidator('invalid'));
  t.false(plugins.analyzeCommits.outputValidator(1));
  t.false(plugins.analyzeCommits.outputValidator({}));

  t.true(plugins.analyzeCommits.outputValidator());
  t.true(plugins.analyzeCommits.outputValidator(null));
  t.true(plugins.analyzeCommits.outputValidator('major'));
});

test('The "generateNotes" plugin output, if defined, must be a string', (t) => {
  t.false(plugins.generateNotes.outputValidator(1));
  t.false(plugins.generateNotes.outputValidator({}));

  t.true(plugins.generateNotes.outputValidator());
  t.true(plugins.generateNotes.outputValidator(null));
  t.true(plugins.generateNotes.outputValidator(''));
  t.true(plugins.generateNotes.outputValidator('string'));
});

test('The "publish" plugin output, if defined, must be an object or "false"', (t) => {
  t.false(plugins.publish.outputValidator(1));
  t.false(plugins.publish.outputValidator('string'));

  t.true(plugins.publish.outputValidator({}));
  t.true(plugins.publish.outputValidator());
  t.true(plugins.publish.outputValidator(null));
  t.true(plugins.publish.outputValidator(''));
  t.true(plugins.publish.outputValidator(false));
});

test('The "addChannel" plugin output, if defined, must be an object', (t) => {
  t.false(plugins.addChannel.outputValidator(1));
  t.false(plugins.addChannel.outputValidator('string'));

  t.true(plugins.addChannel.outputValidator({}));
  t.true(plugins.addChannel.outputValidator());
  t.true(plugins.addChannel.outputValidator(null));
  t.true(plugins.addChannel.outputValidator(''));
});

test('The "generateNotes" plugins output are concatenated with separator and sensitive data is hidden', (t) => {
  const env = {MY_TOKEN: 'secret token'};
  t.is(plugins.generateNotes.postprocess(['note 1', 'note 2'], {env}), `note 1${RELEASE_NOTES_SEPARATOR}note 2`);
  t.is(plugins.generateNotes.postprocess(['', 'note'], {env}), 'note');
  t.is(plugins.generateNotes.postprocess([undefined, 'note'], {env}), 'note');
  t.is(plugins.generateNotes.postprocess(['note 1', '', 'note 2'], {env}), `note 1${RELEASE_NOTES_SEPARATOR}note 2`);
  t.is(
    plugins.generateNotes.postprocess(['note 1', undefined, 'note 2'], {env}),
    `note 1${RELEASE_NOTES_SEPARATOR}note 2`
  );

  t.is(
    plugins.generateNotes.postprocess(
      [`Note 1: Exposing token ${env.MY_TOKEN}`, `Note 2: Exposing token ${SECRET_REPLACEMENT}`],
      {env}
    ),
    `Note 1: Exposing token ${SECRET_REPLACEMENT}${RELEASE_NOTES_SEPARATOR}Note 2: Exposing token ${SECRET_REPLACEMENT}`
  );
});

test('The "analyzeCommits" plugins output are reduced to the highest release type', (t) => {
  t.is(plugins.analyzeCommits.postprocess(['major', 'minor']), 'major');
  t.is(plugins.analyzeCommits.postprocess(['', 'minor']), 'minor');
  t.is(plugins.analyzeCommits.postprocess([undefined, 'patch']), 'patch');
  t.is(plugins.analyzeCommits.postprocess([null, 'patch']), 'patch');
  t.is(plugins.analyzeCommits.postprocess(['wrong_type', 'minor']), 'minor');
  t.is(plugins.analyzeCommits.postprocess([]), undefined);
  t.is(plugins.analyzeCommits.postprocess(['wrong_type']), undefined);
});

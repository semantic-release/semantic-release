import test from 'ava';
import plugins from '../../lib/definitions/plugins';
import {RELEASE_NOTES_SEPARATOR, SECRET_REPLACEMENT} from '../../lib/definitions/constants';

test('The "analyzeCommits" plugin output must be either undefined or a valid semver release type', t => {
  t.false(plugins.analyzeCommits.outputValidator('invalid'));
  t.false(plugins.analyzeCommits.outputValidator(1));
  t.false(plugins.analyzeCommits.outputValidator({}));

  t.true(plugins.analyzeCommits.outputValidator());
  t.true(plugins.analyzeCommits.outputValidator(null));
  t.true(plugins.analyzeCommits.outputValidator('major'));
});

test('The "generateNotes" plugin output, if defined, must be a string', t => {
  t.false(plugins.generateNotes.outputValidator(1));
  t.false(plugins.generateNotes.outputValidator({}));

  t.true(plugins.generateNotes.outputValidator());
  t.true(plugins.generateNotes.outputValidator(null));
  t.true(plugins.generateNotes.outputValidator(''));
  t.true(plugins.generateNotes.outputValidator('string'));
});

test('The "publish" plugin output, if defined, must be an object', t => {
  t.false(plugins.publish.outputValidator(1));
  t.false(plugins.publish.outputValidator('string'));

  t.true(plugins.publish.outputValidator({}));
  t.true(plugins.publish.outputValidator());
  t.true(plugins.publish.outputValidator(null));
  t.true(plugins.publish.outputValidator(''));
});

test('The "generateNotes" plugins output are concatenated with separator and sensitive data is hidden', t => {
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

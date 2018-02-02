import test from 'ava';
import plugins from '../../lib/definitions/plugins';
import errors from '../../lib/definitions/errors';

test('The "verifyConditions" plugin, if defined, must be a single or an array of plugins definition', t => {
  t.false(plugins.verifyConditions.config.validator({}));
  t.false(plugins.verifyConditions.config.validator({path: null}));

  t.true(plugins.verifyConditions.config.validator({path: 'plugin-path.js'}));
  t.true(plugins.verifyConditions.config.validator());
  t.true(plugins.verifyConditions.config.validator('plugin-path.js'));
  t.true(plugins.verifyConditions.config.validator(() => {}));
  t.true(plugins.verifyConditions.config.validator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('The "analyzeCommits" plugin is mandatory, and must be a single plugin definition', t => {
  t.false(plugins.analyzeCommits.config.validator({}));
  t.false(plugins.analyzeCommits.config.validator({path: null}));
  t.false(plugins.analyzeCommits.config.validator([]));
  t.false(plugins.analyzeCommits.config.validator());

  t.true(plugins.analyzeCommits.config.validator({path: 'plugin-path.js'}));
  t.true(plugins.analyzeCommits.config.validator('plugin-path.js'));
  t.true(plugins.analyzeCommits.config.validator(() => {}));
});

test('The "verifyRelease" plugin, if defined, must be a single or an array of plugins definition', t => {
  t.false(plugins.verifyRelease.config.validator({}));
  t.false(plugins.verifyRelease.config.validator({path: null}));

  t.true(plugins.verifyRelease.config.validator({path: 'plugin-path.js'}));
  t.true(plugins.verifyRelease.config.validator());
  t.true(plugins.verifyRelease.config.validator('plugin-path.js'));
  t.true(plugins.verifyRelease.config.validator(() => {}));
  t.true(plugins.verifyRelease.config.validator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('The "generateNotes" plugin, if defined, must be a single plugin definition', t => {
  t.false(plugins.generateNotes.config.validator({}));
  t.false(plugins.generateNotes.config.validator({path: null}));
  t.false(plugins.generateNotes.config.validator([]));

  t.true(plugins.generateNotes.config.validator());
  t.true(plugins.generateNotes.config.validator({path: 'plugin-path.js'}));
  t.true(plugins.generateNotes.config.validator('plugin-path.js'));
  t.true(plugins.generateNotes.config.validator(() => {}));
});

test('The "publish" plugin is mandatory, and must be a single or an array of plugins definition', t => {
  t.false(plugins.publish.config.validator({}));
  t.false(plugins.publish.config.validator({path: null}));
  t.false(plugins.publish.config.validator());

  t.true(plugins.publish.config.validator({path: 'plugin-path.js'}));
  t.true(plugins.publish.config.validator('plugin-path.js'));
  t.true(plugins.publish.config.validator(() => {}));
  t.true(plugins.publish.config.validator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('The "success" plugin, if defined, must be a single or an array of plugins definition', t => {
  t.false(plugins.success.config.validator({}));
  t.false(plugins.success.config.validator({path: null}));

  t.true(plugins.success.config.validator({path: 'plugin-path.js'}));
  t.true(plugins.success.config.validator());
  t.true(plugins.success.config.validator('plugin-path.js'));
  t.true(plugins.success.config.validator(() => {}));
  t.true(plugins.success.config.validator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('The "fail" plugin, if defined, must be a single or an array of plugins definition', t => {
  t.false(plugins.fail.config.validator({}));
  t.false(plugins.fail.config.validator({path: null}));

  t.true(plugins.fail.config.validator({path: 'plugin-path.js'}));
  t.true(plugins.fail.config.validator());
  t.true(plugins.fail.config.validator('plugin-path.js'));
  t.true(plugins.fail.config.validator(() => {}));
  t.true(plugins.fail.config.validator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('The "analyzeCommits" plugin output must be either undefined or a valid semver release type', t => {
  t.false(plugins.analyzeCommits.output.validator('invalid'));
  t.false(plugins.analyzeCommits.output.validator(1));
  t.false(plugins.analyzeCommits.output.validator({}));

  t.true(plugins.analyzeCommits.output.validator());
  t.true(plugins.analyzeCommits.output.validator(null));
  t.true(plugins.analyzeCommits.output.validator('major'));
});

test('The "generateNotes" plugin output, if defined, must be a string', t => {
  t.false(plugins.generateNotes.output.validator(1));
  t.false(plugins.generateNotes.output.validator({}));

  t.true(plugins.generateNotes.output.validator());
  t.true(plugins.generateNotes.output.validator(null));
  t.true(plugins.generateNotes.output.validator(''));
  t.true(plugins.generateNotes.output.validator('string'));
});

test('The "publish" plugin output, if defined, must be an object', t => {
  t.false(plugins.publish.output.validator(1));
  t.false(plugins.publish.output.validator('string'));

  t.true(plugins.publish.output.validator({}));
  t.true(plugins.publish.output.validator());
  t.true(plugins.publish.output.validator(null));
  t.true(plugins.publish.output.validator(''));
});

test('The "analyzeCommits" plugin output definition return an existing error code', t => {
  t.true(Object.keys(errors).includes(plugins.analyzeCommits.output.error));
});

test('The "generateNotes" plugin output definition return an existing error code', t => {
  t.true(Object.keys(errors).includes(plugins.generateNotes.output.error));
});

test('The "publish" plugin output definition return an existing error code', t => {
  t.true(Object.keys(errors).includes(plugins.publish.output.error));
});

import test from 'ava';
import plugins from '../../lib/definitions/plugins';

test('The "verifyConditions" plugin, if defined, must be a single or an array of plugins definition', t => {
  t.false(plugins.verifyConditions.configValidator({}));
  t.false(plugins.verifyConditions.configValidator({path: null}));

  t.true(plugins.verifyConditions.configValidator({path: 'plugin-path.js'}));
  t.true(plugins.verifyConditions.configValidator());
  t.true(plugins.verifyConditions.configValidator('plugin-path.js'));
  t.true(plugins.verifyConditions.configValidator(() => {}));
  t.true(plugins.verifyConditions.configValidator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('The "analyzeCommits" plugin is mandatory, and must be a single plugin definition', t => {
  t.false(plugins.analyzeCommits.configValidator({}));
  t.false(plugins.analyzeCommits.configValidator({path: null}));
  t.false(plugins.analyzeCommits.configValidator([]));
  t.false(plugins.analyzeCommits.configValidator());

  t.true(plugins.analyzeCommits.configValidator({path: 'plugin-path.js'}));
  t.true(plugins.analyzeCommits.configValidator('plugin-path.js'));
  t.true(plugins.analyzeCommits.configValidator(() => {}));
});

test('The "verifyRelease" plugin, if defined, must be a single or an array of plugins definition', t => {
  t.false(plugins.verifyRelease.configValidator({}));
  t.false(plugins.verifyRelease.configValidator({path: null}));

  t.true(plugins.verifyRelease.configValidator({path: 'plugin-path.js'}));
  t.true(plugins.verifyRelease.configValidator());
  t.true(plugins.verifyRelease.configValidator('plugin-path.js'));
  t.true(plugins.verifyRelease.configValidator(() => {}));
  t.true(plugins.verifyRelease.configValidator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('The "generateNotes" plugin, if defined, must be a single plugin definition', t => {
  t.false(plugins.generateNotes.configValidator({}));
  t.false(plugins.generateNotes.configValidator({path: null}));
  t.false(plugins.generateNotes.configValidator([]));

  t.true(plugins.generateNotes.configValidator());
  t.true(plugins.generateNotes.configValidator({path: 'plugin-path.js'}));
  t.true(plugins.generateNotes.configValidator('plugin-path.js'));
  t.true(plugins.generateNotes.configValidator(() => {}));
});

test('The "prepare" plugin, if defined, must be a single or an array of plugins definition', t => {
  t.false(plugins.verifyRelease.configValidator({}));
  t.false(plugins.verifyRelease.configValidator({path: null}));

  t.true(plugins.verifyRelease.configValidator({path: 'plugin-path.js'}));
  t.true(plugins.verifyRelease.configValidator());
  t.true(plugins.verifyRelease.configValidator('plugin-path.js'));
  t.true(plugins.verifyRelease.configValidator(() => {}));
  t.true(plugins.verifyRelease.configValidator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('The "publish" plugin is mandatory, and must be a single or an array of plugins definition', t => {
  t.false(plugins.publish.configValidator({}));
  t.false(plugins.publish.configValidator({path: null}));

  t.true(plugins.publish.configValidator({path: 'plugin-path.js'}));
  t.true(plugins.publish.configValidator());
  t.true(plugins.publish.configValidator('plugin-path.js'));
  t.true(plugins.publish.configValidator(() => {}));
  t.true(plugins.publish.configValidator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('The "success" plugin, if defined, must be a single or an array of plugins definition', t => {
  t.false(plugins.success.configValidator({}));
  t.false(plugins.success.configValidator({path: null}));

  t.true(plugins.success.configValidator({path: 'plugin-path.js'}));
  t.true(plugins.success.configValidator());
  t.true(plugins.success.configValidator('plugin-path.js'));
  t.true(plugins.success.configValidator(() => {}));
  t.true(plugins.success.configValidator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('The "fail" plugin, if defined, must be a single or an array of plugins definition', t => {
  t.false(plugins.fail.configValidator({}));
  t.false(plugins.fail.configValidator({path: null}));

  t.true(plugins.fail.configValidator({path: 'plugin-path.js'}));
  t.true(plugins.fail.configValidator());
  t.true(plugins.fail.configValidator('plugin-path.js'));
  t.true(plugins.fail.configValidator(() => {}));
  t.true(plugins.fail.configValidator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

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

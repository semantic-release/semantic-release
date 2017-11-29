import test from 'ava';
import definitions from '../../lib/plugins/definitions';

test('The "verifyConditions" plugin, if defined, must be a single or an array of plugins definition', t => {
  t.false(definitions.verifyConditions.config.validator({}));
  t.false(definitions.verifyConditions.config.validator({path: null}));

  t.true(definitions.verifyConditions.config.validator({path: 'plugin-path.js'}));
  t.true(definitions.verifyConditions.config.validator());
  t.true(definitions.verifyConditions.config.validator('plugin-path.js'));
  t.true(definitions.verifyConditions.config.validator(() => {}));
  t.true(definitions.verifyConditions.config.validator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('The "getLastRelease" plugin is mandatory, and must be a single plugin definition', t => {
  t.false(definitions.getLastRelease.config.validator({}));
  t.false(definitions.getLastRelease.config.validator({path: null}));
  t.false(definitions.getLastRelease.config.validator([]));
  t.false(definitions.getLastRelease.config.validator());

  t.true(definitions.getLastRelease.config.validator({path: 'plugin-path.js'}));
  t.true(definitions.getLastRelease.config.validator('plugin-path.js'));
  t.true(definitions.getLastRelease.config.validator(() => {}));
});

test('The "analyzeCommits" plugin is mandatory, and must be a single plugin definition', t => {
  t.false(definitions.analyzeCommits.config.validator({}));
  t.false(definitions.analyzeCommits.config.validator({path: null}));
  t.false(definitions.analyzeCommits.config.validator([]));
  t.false(definitions.analyzeCommits.config.validator());

  t.true(definitions.analyzeCommits.config.validator({path: 'plugin-path.js'}));
  t.true(definitions.analyzeCommits.config.validator('plugin-path.js'));
  t.true(definitions.analyzeCommits.config.validator(() => {}));
});

test('The "verifyRelease" plugin, if defined, must be a single or an array of plugins definition', t => {
  t.false(definitions.verifyRelease.config.validator({}));
  t.false(definitions.verifyRelease.config.validator({path: null}));

  t.true(definitions.verifyRelease.config.validator({path: 'plugin-path.js'}));
  t.true(definitions.verifyRelease.config.validator());
  t.true(definitions.verifyRelease.config.validator('plugin-path.js'));
  t.true(definitions.verifyRelease.config.validator(() => {}));
  t.true(definitions.verifyRelease.config.validator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('The "generateNotes" plugin, if defined, must be a single plugin definition', t => {
  t.false(definitions.generateNotes.config.validator({}));
  t.false(definitions.generateNotes.config.validator({path: null}));
  t.false(definitions.generateNotes.config.validator([]));

  t.true(definitions.generateNotes.config.validator());
  t.true(definitions.generateNotes.config.validator({path: 'plugin-path.js'}));
  t.true(definitions.generateNotes.config.validator('plugin-path.js'));
  t.true(definitions.generateNotes.config.validator(() => {}));
});

test('The "publish" plugin is mandatory, and must be a single or an array of plugins definition', t => {
  t.false(definitions.publish.config.validator({}));
  t.false(definitions.publish.config.validator({path: null}));
  t.false(definitions.publish.config.validator());

  t.true(definitions.publish.config.validator({path: 'plugin-path.js'}));
  t.true(definitions.publish.config.validator('plugin-path.js'));
  t.true(definitions.publish.config.validator(() => {}));
  t.true(definitions.publish.config.validator([{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('The "getLastRelease" plugin output if defined, must be an object with an optionnal valid semver version in the "version" property', t => {
  t.false(definitions.getLastRelease.output.validator('string'));
  t.false(definitions.getLastRelease.output.validator(1));
  t.false(definitions.getLastRelease.output.validator({version: 'invalid'}));

  t.true(definitions.getLastRelease.output.validator());
  t.true(definitions.getLastRelease.output.validator({}));
  t.true(definitions.getLastRelease.output.validator({version: 'v1.0.0'}));
  t.true(definitions.getLastRelease.output.validator({version: '1.0.0'}));
  t.true(definitions.getLastRelease.output.validator({version: null}));
});

test('The "analyzeCommits" plugin output must be either undefined or a valid semver release type', t => {
  t.false(definitions.analyzeCommits.output.validator('invalid'));
  t.false(definitions.analyzeCommits.output.validator(1));
  t.false(definitions.analyzeCommits.output.validator({}));

  t.true(definitions.analyzeCommits.output.validator());
  t.true(definitions.analyzeCommits.output.validator(null));
  t.true(definitions.analyzeCommits.output.validator('major'));
});

test('The "generateNotes" plugin output, if defined, must be a string', t => {
  t.false(definitions.generateNotes.output.validator(1));
  t.false(definitions.generateNotes.output.validator({}));

  t.true(definitions.generateNotes.output.validator());
  t.true(definitions.generateNotes.output.validator(null));
  t.true(definitions.generateNotes.output.validator(''));
  t.true(definitions.generateNotes.output.validator('string'));
});

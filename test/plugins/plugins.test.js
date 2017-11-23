import test from 'ava';
import {stub} from 'sinon';
import getPlugins from '../../lib/plugins';

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Export default plugins', t => {
  const plugins = getPlugins({}, t.context.logger);

  // Verify the module returns a function for each plugin
  t.is(typeof plugins.verifyConditions, 'function');
  t.is(typeof plugins.getLastRelease, 'function');
  t.is(typeof plugins.analyzeCommits, 'function');
  t.is(typeof plugins.verifyRelease, 'function');
  t.is(typeof plugins.generateNotes, 'function');
  t.is(typeof plugins.publish, 'function');
});

test('Export plugins based on config', t => {
  const plugins = getPlugins(
    {
      verifyConditions: ['./test/fixtures/plugin-noop', {path: './test/fixtures/plugin-noop'}],
      getLastRelease: './test/fixtures/plugin-noop',
      analyzeCommits: {path: './test/fixtures/plugin-noop'},
      verifyRelease: () => {},
    },
    t.context.logger
  );

  // Verify the module returns a function for each plugin
  t.is(typeof plugins.verifyConditions, 'function');
  t.is(typeof plugins.getLastRelease, 'function');
  t.is(typeof plugins.analyzeCommits, 'function');
  t.is(typeof plugins.verifyRelease, 'function');
  t.is(typeof plugins.generateNotes, 'function');
  t.is(typeof plugins.publish, 'function');
});

test('Use default when only options are passed for a single plugin', t => {
  const plugins = getPlugins({getLastRelease: {}, analyzeCommits: {}}, t.context.logger);

  // Verify the module returns a function for each plugin
  t.is(typeof plugins.getLastRelease, 'function');
  t.is(typeof plugins.analyzeCommits, 'function');
});

test('Throw an error if plugin configuration is missing a path for plugin pipeline', t => {
  const error = t.throws(() => getPlugins({verifyConditions: {}}, t.context.logger));

  t.is(
    error.message,
    'The "verifyConditions" plugin, if defined, must be a single or an array of plugins definition. A plugin definition is either a string or an object with a path property.'
  );
});

test('Throw an error if an array of plugin configuration is missing a path for plugin pipeline', t => {
  const error = t.throws(() => getPlugins({verifyConditions: [{path: '@semantic-release/npm'}, {}]}, t.context.logger));

  t.is(
    error.message,
    'The "verifyConditions" plugin, if defined, must be a single or an array of plugins definition. A plugin definition is either a string or an object with a path property.'
  );
});

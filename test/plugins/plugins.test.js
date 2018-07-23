import path from 'path';
import test from 'ava';
import {copy, outputFile} from 'fs-extra';
import {stub} from 'sinon';
import tempy from 'tempy';
import getPlugins from '../../lib/plugins';

// Save the current working diretory
const cwd = process.cwd();

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.success = stub();
  t.context.logger = {log: t.context.log, success: t.context.success, scope: () => t.context.logger};
});

test('Export default plugins', t => {
  const plugins = getPlugins({cwd, options: {}, logger: t.context.logger}, {});

  // Verify the module returns a function for each plugin
  t.is(typeof plugins.verifyConditions, 'function');
  t.is(typeof plugins.analyzeCommits, 'function');
  t.is(typeof plugins.verifyRelease, 'function');
  t.is(typeof plugins.generateNotes, 'function');
  t.is(typeof plugins.prepare, 'function');
  t.is(typeof plugins.publish, 'function');
  t.is(typeof plugins.success, 'function');
  t.is(typeof plugins.fail, 'function');
});

test('Export plugins based on config', t => {
  const plugins = getPlugins(
    {
      cwd,
      logger: t.context.logger,
      options: {
        verifyConditions: ['./test/fixtures/plugin-noop', {path: './test/fixtures/plugin-noop'}],
        generateNotes: './test/fixtures/plugin-noop',
        analyzeCommits: {path: './test/fixtures/plugin-noop'},
        verifyRelease: () => {},
      },
    },
    {}
  );

  // Verify the module returns a function for each plugin
  t.is(typeof plugins.verifyConditions, 'function');
  t.is(typeof plugins.analyzeCommits, 'function');
  t.is(typeof plugins.verifyRelease, 'function');
  t.is(typeof plugins.generateNotes, 'function');
  t.is(typeof plugins.prepare, 'function');
  t.is(typeof plugins.publish, 'function');
  t.is(typeof plugins.success, 'function');
  t.is(typeof plugins.fail, 'function');
});

test('Export plugins loaded from the dependency of a shareable config module', async t => {
  const cwd = tempy.directory();
  await copy(
    './test/fixtures/plugin-noop.js',
    path.resolve(cwd, 'node_modules/shareable-config/node_modules/custom-plugin/index.js')
  );
  await outputFile(path.resolve(cwd, 'node_modules/shareable-config/index.js'), '');

  const plugins = getPlugins(
    {
      cwd,
      logger: t.context.logger,
      options: {
        verifyConditions: ['custom-plugin', {path: 'custom-plugin'}],
        generateNotes: 'custom-plugin',
        analyzeCommits: {path: 'custom-plugin'},
        verifyRelease: () => {},
      },
    },
    {'custom-plugin': 'shareable-config'}
  );

  // Verify the module returns a function for each plugin
  t.is(typeof plugins.verifyConditions, 'function');
  t.is(typeof plugins.analyzeCommits, 'function');
  t.is(typeof plugins.verifyRelease, 'function');
  t.is(typeof plugins.generateNotes, 'function');
  t.is(typeof plugins.prepare, 'function');
  t.is(typeof plugins.publish, 'function');
  t.is(typeof plugins.success, 'function');
  t.is(typeof plugins.fail, 'function');
});

test('Export plugins loaded from the dependency of a shareable config file', async t => {
  const cwd = tempy.directory();
  await copy('./test/fixtures/plugin-noop.js', path.resolve(cwd, 'plugin/plugin-noop.js'));
  await outputFile(path.resolve(cwd, 'shareable-config.js'), '');

  const plugins = getPlugins(
    {
      cwd,
      logger: t.context.logger,
      options: {
        verifyConditions: ['./plugin/plugin-noop', {path: './plugin/plugin-noop'}],
        generateNotes: './plugin/plugin-noop',
        analyzeCommits: {path: './plugin/plugin-noop'},
        verifyRelease: () => {},
      },
    },
    {'./plugin/plugin-noop': './shareable-config.js'}
  );

  // Verify the module returns a function for each plugin
  t.is(typeof plugins.verifyConditions, 'function');
  t.is(typeof plugins.analyzeCommits, 'function');
  t.is(typeof plugins.verifyRelease, 'function');
  t.is(typeof plugins.generateNotes, 'function');
  t.is(typeof plugins.prepare, 'function');
  t.is(typeof plugins.publish, 'function');
  t.is(typeof plugins.success, 'function');
  t.is(typeof plugins.fail, 'function');
});

test('Use default when only options are passed for a single plugin', t => {
  const analyzeCommits = {};
  const generateNotes = {};
  const success = () => {};
  const fail = [() => {}];

  const plugins = getPlugins(
    {cwd, logger: t.context.logger, options: {analyzeCommits, generateNotes, success, fail}},
    {}
  );

  // Verify the module returns a function for each plugin
  t.is(typeof plugins.analyzeCommits, 'function');
  t.is(typeof plugins.generateNotes, 'function');
  t.is(typeof plugins.success, 'function');
  t.is(typeof plugins.fail, 'function');

  // Verify only the plugins defined as an object with no `path` are set to the default value
  t.falsy(success.path);
  t.falsy(fail.path);
});

test('Merge global options with plugin options', async t => {
  const plugins = getPlugins(
    {
      cwd,
      logger: t.context.logger,
      options: {
        globalOpt: 'global',
        otherOpt: 'globally-defined',
        verifyRelease: {path: './test/fixtures/plugin-result-config', localOpt: 'local', otherOpt: 'locally-defined'},
      },
    },
    {}
  );

  const [result] = await plugins.verifyRelease();

  t.deepEqual(result.pluginConfig, {localOpt: 'local', globalOpt: 'global', otherOpt: 'locally-defined'});
});

test('Throw an error if plugins configuration are missing a path for plugin pipeline', t => {
  const errors = [...t.throws(() => getPlugins({cwd, logger: t.context.logger, options: {verifyConditions: {}}}, {}))];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'EPLUGINCONF');
});

test('Throw an error if an array of plugin configuration is missing a path for plugin pipeline', t => {
  const errors = [
    ...t.throws(() =>
      getPlugins(
        {cwd, logger: t.context.logger, options: {verifyConditions: [{path: '@semantic-release/npm'}, {}]}},
        {}
      )
    ),
  ];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'EPLUGINCONF');
});

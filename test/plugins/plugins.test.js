const path = require('path');
const test = require('ava');
const {copy, outputFile} = require('fs-extra');
const {stub} = require('sinon');
const tempy = require('tempy');
const getPlugins = require('../../lib/plugins');

// Save the current working diretory
const cwd = process.cwd();

test.beforeEach((t) => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.success = stub();
  t.context.logger = {log: t.context.log, success: t.context.success, scope: () => t.context.logger};
});

test('Export default plugins', async (t) => {
  const plugins = await getPlugins({cwd, options: {}, logger: t.context.logger}, {});

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

test('Export plugins based on steps config', async (t) => {
  const plugins = await getPlugins(
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

test('Export plugins based on "plugins" config (array)', async (t) => {
  const plugin1 = {verifyConditions: stub(), publish: stub()};
  const plugin2 = {verifyConditions: stub(), verifyRelease: stub()};
  const plugins = await getPlugins(
    {cwd, logger: t.context.logger, options: {plugins: [plugin1, [plugin2, {}]], verifyRelease: () => {}}},
    {}
  );
  await plugins.verifyConditions({options: {}});
  t.true(plugin1.verifyConditions.calledOnce);
  t.true(plugin2.verifyConditions.calledOnce);

  await plugins.publish({options: {}});
  t.true(plugin1.publish.calledOnce);

  await plugins.verifyRelease({options: {}});
  t.true(plugin2.verifyRelease.notCalled);

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

test('Export plugins based on "plugins" config (single definition)', async (t) => {
  const plugin1 = {verifyConditions: stub(), publish: stub()};
  const plugins = await getPlugins({cwd, logger: t.context.logger, options: {plugins: plugin1}}, {});

  await plugins.verifyConditions({options: {}});
  t.true(plugin1.verifyConditions.calledOnce);

  await plugins.publish({options: {}});
  t.true(plugin1.publish.calledOnce);

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

test('Merge global options, "plugins" options and step options', async (t) => {
  const plugin1 = [{verifyConditions: stub(), publish: stub()}, {pluginOpt1: 'plugin1'}];
  const plugin2 = [{verifyConditions: stub()}, {pluginOpt2: 'plugin2'}];
  const plugin3 = [stub(), {pluginOpt3: 'plugin3'}];
  const plugins = await getPlugins(
    {
      cwd,
      logger: t.context.logger,
      options: {globalOpt: 'global', plugins: [plugin1, plugin2], verifyRelease: [plugin3]},
    },
    {}
  );

  await plugins.verifyConditions({options: {}});
  t.deepEqual(plugin1[0].verifyConditions.args[0][0], {globalOpt: 'global', pluginOpt1: 'plugin1'});
  t.deepEqual(plugin2[0].verifyConditions.args[0][0], {globalOpt: 'global', pluginOpt2: 'plugin2'});

  await plugins.publish({options: {}});
  t.deepEqual(plugin1[0].publish.args[0][0], {globalOpt: 'global', pluginOpt1: 'plugin1'});

  await plugins.verifyRelease({options: {}});
  t.deepEqual(plugin3[0].args[0][0], {globalOpt: 'global', pluginOpt3: 'plugin3'});
});

test('Unknown steps of plugins configured in "plugins" are ignored', async (t) => {
  const plugin1 = {verifyConditions: () => {}, unknown: () => {}};
  const plugins = await getPlugins({cwd, logger: t.context.logger, options: {plugins: [plugin1]}}, {});

  t.is(typeof plugins.verifyConditions, 'function');
  t.is(plugins.unknown, undefined);
});

test('Export plugins loaded from the dependency of a shareable config module', async (t) => {
  const cwd = tempy.directory();
  await copy(
    './test/fixtures/plugin-noop.js',
    path.resolve(cwd, 'node_modules/shareable-config/node_modules/custom-plugin/index.js')
  );
  await outputFile(path.resolve(cwd, 'node_modules/shareable-config/index.js'), '');

  const plugins = await getPlugins(
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

test('Export plugins loaded from the dependency of a shareable config file', async (t) => {
  const cwd = tempy.directory();
  await copy('./test/fixtures/plugin-noop.js', path.resolve(cwd, 'plugin/plugin-noop.js'));
  await outputFile(path.resolve(cwd, 'shareable-config.js'), '');

  const plugins = await getPlugins(
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

test('Use default when only options are passed for a single plugin', async (t) => {
  const analyzeCommits = {};
  const generateNotes = {};
  const publish = {};
  const success = () => {};
  const fail = [() => {}];

  const plugins = await getPlugins(
    {
      cwd,
      logger: t.context.logger,
      options: {
        plugins: ['@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator'],
        analyzeCommits,
        generateNotes,
        publish,
        success,
        fail,
      },
    },
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

test('Merge global options with plugin options', async (t) => {
  const plugins = await getPlugins(
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

  const [result] = await plugins.verifyRelease({options: {}});

  t.deepEqual(result.pluginConfig, {localOpt: 'local', globalOpt: 'global', otherOpt: 'locally-defined'});
});

test('Throw an error for each invalid plugin configuration', async (t) => {
  const errors = [
    ...(await t.throwsAsync(() =>
      getPlugins(
        {
          cwd,
          logger: t.context.logger,
          options: {
            plugins: ['@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator'],
            verifyConditions: 1,
            analyzeCommits: [],
            verifyRelease: [{}],
            generateNotes: [{path: null}],
          },
        },
        {}
      )
    )),
  ];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'EPLUGINCONF');
  t.is(errors[1].name, 'SemanticReleaseError');
  t.is(errors[1].code, 'EPLUGINCONF');
  t.is(errors[2].name, 'SemanticReleaseError');
  t.is(errors[2].code, 'EPLUGINCONF');
  t.is(errors[3].name, 'SemanticReleaseError');
  t.is(errors[3].code, 'EPLUGINCONF');
});

test('Throw EPLUGINSCONF error if the "plugins" option contains an old plugin definition (returns a function)', async (t) => {
  const errors = [
    ...(await t.throwsAsync(() =>
      getPlugins(
        {
          cwd,
          logger: t.context.logger,
          options: {plugins: ['./test/fixtures/multi-plugin', './test/fixtures/plugin-noop', () => {}]},
        },
        {}
      )
    )),
  ];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'EPLUGINSCONF');
  t.is(errors[1].name, 'SemanticReleaseError');
  t.is(errors[1].code, 'EPLUGINSCONF');
});

test('Throw EPLUGINSCONF error for each invalid definition if the "plugins" option', async (t) => {
  const errors = [
    ...(await t.throwsAsync(() =>
      getPlugins({cwd, logger: t.context.logger, options: {plugins: [1, {path: 1}, [() => {}, {}, {}]]}}, {})
    )),
  ];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'EPLUGINSCONF');
  t.is(errors[1].name, 'SemanticReleaseError');
  t.is(errors[1].code, 'EPLUGINSCONF');
  t.is(errors[2].name, 'SemanticReleaseError');
  t.is(errors[2].code, 'EPLUGINSCONF');
});

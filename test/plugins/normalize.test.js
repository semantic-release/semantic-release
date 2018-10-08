import test from 'ava';
import {noop} from 'lodash';
import {stub} from 'sinon';
import normalize from '../../lib/plugins/normalize';

const cwd = process.cwd();

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.error = stub();
  t.context.success = stub();
  t.context.stderr = {write: stub()};
  t.context.logger = {
    log: t.context.log,
    error: t.context.error,
    success: t.context.success,
    scope: () => t.context.logger,
  };
});

test('Normalize and load plugin from string', t => {
  const plugin = normalize(
    {cwd, options: {}, logger: t.context.logger},
    'verifyConditions',
    './test/fixtures/plugin-noop',
    {}
  );

  t.is(plugin.pluginName, './test/fixtures/plugin-noop');
  t.is(typeof plugin, 'function');
  t.deepEqual(t.context.success.args[0], ['Loaded plugin "verifyConditions" from "./test/fixtures/plugin-noop"']);
});

test('Normalize and load plugin from object', t => {
  const plugin = normalize(
    {cwd, options: {}, logger: t.context.logger},
    'publish',
    {path: './test/fixtures/plugin-noop'},
    {}
  );

  t.is(plugin.pluginName, './test/fixtures/plugin-noop');
  t.is(typeof plugin, 'function');
  t.deepEqual(t.context.success.args[0], ['Loaded plugin "publish" from "./test/fixtures/plugin-noop"']);
});

test('Normalize and load plugin from a base file path', t => {
  const plugin = normalize({cwd, options: {}, logger: t.context.logger}, 'verifyConditions', './plugin-noop', {
    './plugin-noop': './test/fixtures',
  });

  t.is(plugin.pluginName, './plugin-noop');
  t.is(typeof plugin, 'function');
  t.deepEqual(t.context.success.args[0], [
    'Loaded plugin "verifyConditions" from "./plugin-noop" in shareable config "./test/fixtures"',
  ]);
});

test('Wrap plugin in a function that add the "pluginName" to the error"', async t => {
  const plugin = normalize({cwd, options: {}, logger: t.context.logger}, 'verifyConditions', './plugin-error', {
    './plugin-error': './test/fixtures',
  });

  const error = await t.throws(plugin());

  t.is(error.pluginName, './plugin-error');
});

test('Wrap plugin in a function that add the "pluginName" to multiple errors"', async t => {
  const plugin = normalize({cwd, options: {}, logger: t.context.logger}, 'verifyConditions', './plugin-errors', {
    './plugin-errors': './test/fixtures',
  });

  const errors = [...(await t.throws(plugin()))];
  for (const error of errors) {
    t.is(error.pluginName, './plugin-errors');
  }
});

test('Normalize and load plugin from function', t => {
  const pluginFunction = () => {};
  const plugin = normalize({cwd, options: {}, logger: t.context.logger}, '', pluginFunction, {});

  t.is(plugin.pluginName, '[Function: pluginFunction]');
  t.is(typeof plugin, 'function');
});

test('Normalize and load plugin that retuns multiple functions', t => {
  const plugin = normalize(
    {cwd, options: {}, logger: t.context.logger},
    'verifyConditions',
    './test/fixtures/multi-plugin',
    {}
  );

  t.is(typeof plugin, 'function');
  t.deepEqual(t.context.success.args[0], ['Loaded plugin "verifyConditions" from "./test/fixtures/multi-plugin"']);
});

test('Wrap "analyzeCommits" plugin in a function that validate the output of the plugin', async t => {
  const analyzeCommits = stub().resolves(2);
  const plugin = normalize(
    {cwd, options: {}, stderr: t.context.stderr, logger: t.context.logger},
    'analyzeCommits',
    analyzeCommits,
    {}
  );

  const error = await t.throws(plugin());

  t.is(error.code, 'EANALYZECOMMITSOUTPUT');
  t.is(error.name, 'SemanticReleaseError');
  t.truthy(error.message);
  t.truthy(error.details);
  t.regex(error.details, /2/);
});

test('Wrap "generateNotes" plugin in a function that validate the output of the plugin', async t => {
  const generateNotes = stub().resolves(2);
  const plugin = normalize(
    {cwd, options: {}, stderr: t.context.stderr, logger: t.context.logger},
    'generateNotes',
    generateNotes,
    {}
  );

  const error = await t.throws(plugin());

  t.is(error.code, 'EGENERATENOTESOUTPUT');
  t.is(error.name, 'SemanticReleaseError');
  t.truthy(error.message);
  t.truthy(error.details);
  t.regex(error.details, /2/);
});

test('Wrap "publish" plugin in a function that validate the output of the plugin', async t => {
  const publish = stub().resolves(2);
  const plugin = normalize(
    {cwd, options: {}, stderr: t.context.stderr, logger: t.context.logger},
    'publish',
    publish,
    {}
  );

  const error = await t.throws(plugin());

  t.is(error.code, 'EPUBLISHOUTPUT');
  t.is(error.name, 'SemanticReleaseError');
  t.truthy(error.message);
  t.truthy(error.details);
  t.regex(error.details, /2/);
});

test('Plugin is called with "pluginConfig" (with object definition) and input', async t => {
  const pluginFunction = stub().resolves();
  const pluginConf = {path: pluginFunction, conf: 'confValue'};
  const options = {global: 'globalValue'};
  const plugin = normalize({cwd, options, logger: t.context.logger}, '', pluginConf, {});
  await plugin({param: 'param'});

  t.true(
    pluginFunction.calledWithMatch(
      {conf: 'confValue', global: 'globalValue'},
      {param: 'param', logger: t.context.logger}
    )
  );
});

test('Plugin is called with "pluginConfig" (with array definition) and input', async t => {
  const pluginFunction = stub().resolves();
  const pluginConf = [pluginFunction, {conf: 'confValue'}];
  const options = {global: 'globalValue'};
  const plugin = normalize({cwd, options, logger: t.context.logger}, '', pluginConf, {});
  await plugin({param: 'param'});

  t.true(
    pluginFunction.calledWithMatch(
      {conf: 'confValue', global: 'globalValue'},
      {param: 'param', logger: t.context.logger}
    )
  );
});

test('Prevent plugins to modify "pluginConfig"', async t => {
  const pluginFunction = stub().callsFake(pluginConfig => {
    pluginConfig.conf.subConf = 'otherConf';
  });
  const pluginConf = {path: pluginFunction, conf: {subConf: 'originalConf'}};
  const options = {globalConf: {globalSubConf: 'originalGlobalConf'}};
  const plugin = normalize({cwd, options, logger: t.context.logger}, '', pluginConf, {});
  await plugin();

  t.is(pluginConf.conf.subConf, 'originalConf');
  t.is(options.globalConf.globalSubConf, 'originalGlobalConf');
});

test('Prevent plugins to modify its input', async t => {
  const pluginFunction = stub().callsFake((pluginConfig, options) => {
    options.param.subParam = 'otherParam';
  });
  const input = {param: {subParam: 'originalSubParam'}};
  const plugin = normalize({cwd, options: {}, logger: t.context.logger}, '', pluginFunction, {});
  await plugin(input);

  t.is(input.param.subParam, 'originalSubParam');
});

test('Return noop if the plugin is not defined', t => {
  const plugin = normalize({cwd, options: {}, logger: t.context.logger});

  t.is(plugin, noop);
});

test('Always pass a defined "pluginConfig" for plugin defined with string', async t => {
  // Call the normalize function with the path of a plugin that returns its config
  const plugin = normalize(
    {cwd, options: {}, logger: t.context.logger},
    '',
    './test/fixtures/plugin-result-config',
    {}
  );
  const pluginResult = await plugin();

  t.deepEqual(pluginResult.pluginConfig, {});
});

test('Always pass a defined "pluginConfig" for plugin defined with path', async t => {
  // Call the normalize function with the path of a plugin that returns its config
  const plugin = normalize(
    {cwd, options: {}, logger: t.context.logger},
    '',
    {path: './test/fixtures/plugin-result-config'},
    {}
  );
  const pluginResult = await plugin();

  t.deepEqual(pluginResult.pluginConfig, {});
});

test('Throws an error if the plugin return an object without the expected plugin function', t => {
  const error = t.throws(() =>
    normalize({cwd, options: {}, logger: t.context.logger}, 'inexistantPlugin', './test/fixtures/multi-plugin', {})
  );

  t.is(error.code, 'EPLUGIN');
  t.is(error.name, 'SemanticReleaseError');
  t.truthy(error.message);
  t.truthy(error.details);
});

test('Throws an error if the plugin is not found', t => {
  const error = t.throws(
    () => normalize({cwd, options: {}, logger: t.context.logger}, 'inexistantPlugin', 'non-existing-path', {}),
    Error
  );

  t.is(error.message, "Cannot find module 'non-existing-path'");
  t.is(error.code, 'MODULE_NOT_FOUND');
});

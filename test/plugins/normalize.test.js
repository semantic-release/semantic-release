import test from 'ava';
import {noop} from 'lodash';
import {stub} from 'sinon';
import normalize from '../../lib/plugins/normalize';

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Normalize and load plugin from string', t => {
  const plugin = normalize('verifyConditions', {}, {}, './test/fixtures/plugin-noop', t.context.logger);

  t.is(plugin.pluginName, './test/fixtures/plugin-noop');
  t.is(typeof plugin, 'function');
  t.deepEqual(t.context.log.args[0], ['Load plugin "%s" from %s', 'verifyConditions', './test/fixtures/plugin-noop']);
});

test('Normalize and load plugin from object', t => {
  const plugin = normalize('publish', {}, {}, {path: './test/fixtures/plugin-noop'}, t.context.logger);

  t.is(plugin.pluginName, './test/fixtures/plugin-noop');
  t.is(typeof plugin, 'function');
  t.deepEqual(t.context.log.args[0], ['Load plugin "%s" from %s', 'publish', './test/fixtures/plugin-noop']);
});

test('Normalize and load plugin from a base file path', t => {
  const plugin = normalize(
    'verifyConditions',
    {'./plugin-noop': './test/fixtures'},
    {},
    './plugin-noop',
    t.context.logger
  );

  t.is(plugin.pluginName, './plugin-noop');
  t.is(typeof plugin, 'function');
  t.deepEqual(t.context.log.args[0], [
    'Load plugin "%s" from %s in shareable config %s',
    'verifyConditions',
    './plugin-noop',
    './test/fixtures',
  ]);
});

test('Wrap plugin in a function that add the "pluginName" to the error"', async t => {
  const plugin = normalize(
    'verifyConditions',
    {'./plugin-error': './test/fixtures'},
    {},
    './plugin-error',
    t.context.logger
  );

  const error = await t.throws(plugin());

  t.is(error.pluginName, './plugin-error');
});

test('Wrap plugin in a function that add the "pluginName" to multiple errors"', async t => {
  const plugin = normalize(
    'verifyConditions',
    {'./plugin-errors': './test/fixtures'},
    {},
    './plugin-errors',
    t.context.logger
  );

  const errors = [...(await t.throws(plugin()))];
  for (const error of errors) {
    t.is(error.pluginName, './plugin-errors');
  }
});

test('Normalize and load plugin from function', t => {
  const pluginFunction = () => {};
  const plugin = normalize('', {}, {}, pluginFunction, t.context.logger);

  t.is(plugin.pluginName, '[Function: pluginFunction]');
  t.is(typeof plugin, 'function');
});

test('Normalize and load plugin that retuns multiple functions', t => {
  const plugin = normalize('verifyConditions', {}, {}, './test/fixtures/multi-plugin', t.context.logger);

  t.is(typeof plugin, 'function');
  t.deepEqual(t.context.log.args[0], ['Load plugin "%s" from %s', 'verifyConditions', './test/fixtures/multi-plugin']);
});

test('Wrap "analyzeCommits" plugin in a function that validate the output of the plugin', async t => {
  const analyzeCommits = stub().resolves(2);
  const plugin = normalize('analyzeCommits', {}, {}, analyzeCommits, t.context.logger);

  const error = await t.throws(plugin());

  t.is(error.code, 'EANALYZECOMMITSOUTPUT');
  t.is(error.name, 'SemanticReleaseError');
  t.truthy(error.message);
  t.truthy(error.details);
  t.regex(error.details, /2/);
});

test('Wrap "generateNotes" plugin in a function that validate the output of the plugin', async t => {
  const generateNotes = stub().resolves(2);
  const plugin = normalize('generateNotes', {}, {}, generateNotes, t.context.logger);

  const error = await t.throws(plugin());

  t.is(error.code, 'EGENERATENOTESOUTPUT');
  t.is(error.name, 'SemanticReleaseError');
  t.truthy(error.message);
  t.truthy(error.details);
  t.regex(error.details, /2/);
});

test('Wrap "publish" plugin in a function that validate the output of the plugin', async t => {
  const plugin = normalize(
    'publish',
    {'./plugin-identity': './test/fixtures'},
    {},
    './plugin-identity',
    t.context.logger
  );

  const error = await t.throws(plugin(2));

  t.is(error.code, 'EPUBLISHOUTPUT');
  t.is(error.name, 'SemanticReleaseError');
  t.truthy(error.message);
  t.truthy(error.details);
  t.regex(error.details, /2/);
});

test('Plugin is called with "pluginConfig" (omitting "path", adding global config) and input', async t => {
  const pluginFunction = stub().resolves();
  const conf = {path: pluginFunction, conf: 'confValue'};
  const globalConf = {global: 'globalValue'};
  const plugin = normalize('', {}, globalConf, conf, t.context.logger);
  await plugin('param');

  t.true(pluginFunction.calledWith({conf: 'confValue', global: 'globalValue'}, 'param'));
});

test('Prevent plugins to modify "pluginConfig"', async t => {
  const pluginFunction = stub().callsFake(pluginConfig => {
    pluginConfig.conf.subConf = 'otherConf';
  });
  const conf = {path: pluginFunction, conf: {subConf: 'originalConf'}};
  const globalConf = {globalConf: {globalSubConf: 'originalGlobalConf'}};
  const plugin = normalize('', {}, globalConf, conf, t.context.logger);
  await plugin();

  t.is(conf.conf.subConf, 'originalConf');
  t.is(globalConf.globalConf.globalSubConf, 'originalGlobalConf');
});

test('Prevent plugins to modify its input', async t => {
  const pluginFunction = stub().callsFake((pluginConfig, options) => {
    options.param.subParam = 'otherParam';
  });
  const input = {param: {subParam: 'originalSubParam'}};
  const plugin = normalize('', {}, {}, pluginFunction, t.context.logger);
  await plugin(input);

  t.is(input.param.subParam, 'originalSubParam');
});

test('Return noop if the plugin is not defined', t => {
  const plugin = normalize();

  t.is(plugin, noop);
});

test('Always pass a defined "pluginConfig" for plugin defined with string', async t => {
  // Call the normalize function with the path of a plugin that returns its config
  const plugin = normalize('', {}, {}, './test/fixtures/plugin-result-config', t.context.logger);
  const pluginResult = await plugin();

  t.deepEqual(pluginResult.pluginConfig, {});
});

test('Always pass a defined "pluginConfig" for plugin defined with path', async t => {
  // Call the normalize function with the path of a plugin that returns its config
  const plugin = normalize('', {}, {}, {path: './test/fixtures/plugin-result-config'}, t.context.logger);
  const pluginResult = await plugin();

  t.deepEqual(pluginResult.pluginConfig, {});
});

test('Throws an error if the plugin return an object without the expected plugin function', t => {
  const error = t.throws(() => normalize('inexistantPlugin', {}, {}, './test/fixtures/multi-plugin', t.context.logger));

  t.is(error.code, 'EPLUGIN');
  t.is(error.name, 'SemanticReleaseError');
  t.truthy(error.message);
  t.truthy(error.details);
});

test('Throws an error if the plugin is not found', t => {
  const error = t.throws(() => normalize('inexistantPlugin', {}, {}, 'non-existing-path', t.context.logger), Error);

  t.is(error.message, "Cannot find module 'non-existing-path'");
  t.is(error.code, 'MODULE_NOT_FOUND');
});

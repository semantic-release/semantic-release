import test from 'ava';
import plugins from '../src/lib/plugins';

test('Export plugins', t => {
  // Call the plugin module
  const defaultPlugins = plugins({});

  // Verify the module returns a function for each plugin
  t.is(typeof defaultPlugins.analyzeCommits, 'function');
  t.is(typeof defaultPlugins.generateNotes, 'function');
  t.is(typeof defaultPlugins.verifyConditions, 'function');
  t.is(typeof defaultPlugins.verifyRelease, 'function');
  t.is(typeof defaultPlugins.getLastRelease, 'function');
});

test('Pipeline - Get all results', async t => {
  // Call the plugin module with a verifyRelease plugin pipeline
  const pipelinePlugins = plugins({
    verifyRelease: ['./src/lib/plugin-noop', './test/fixtures/plugin-result-a', './test/fixtures/plugin-result-b'],
  });

  // Call the verifyRelease pipeline
  const results = await pipelinePlugins.verifyRelease({});

  // Verify the pipeline return the expected result for each plugin, in order
  t.deepEqual(results, [undefined, 'a', 'b']);
});

test('Pipeline - Pass pluginConfig and options to each plugins', async t => {
  // Plugin configuration with options (plugin-result-config is a mock plugin returning its pluginConfig and options parameters)
  const pluginConfig = {path: './test/fixtures/plugin-result-config', pluginParam: 'param1'};
  // Semantic-release global options
  const options = {semanticReleaseParam: 'param2'};
  // Call the plugin module with a verifyRelease plugin pipeline
  const pipelinePlugins = plugins({
    verifyRelease: [pluginConfig, './test/fixtures/plugin-result-config'],
  });

  // Call the verifyRelease pipeline
  const results = await pipelinePlugins.verifyRelease(options);

  // Verify the pipeline first result is the pluginConfig and options parameters (to verify the plugin was called with the defined pluginConfig and options parameters)
  t.deepEqual(results, [{pluginConfig, options}, {pluginConfig: {}, options}]);
});

test('Pipeline - Get first error', async t => {
  // Call the plugin module with a verifyRelease plugin pipeline
  const pipelinePlugins = plugins({
    verifyRelease: ['./src/lib/plugin-noop', './test/fixtures/plugin-error-a', './test/fixtures/plugin-error-b'],
  });

  // Call the verifyRelease pipeline and verify it returns the error thrown by './test/fixtures/plugin-error-a'
  await t.throws(pipelinePlugins.verifyRelease({}), 'a');
});

test('Normalize and load plugin from string', t => {
  // Call the normalize function with a path
  const plugin = plugins.normalize('./src/lib/plugin-noop');

  // Verify the plugin is loaded
  t.is(typeof plugin, 'function');
});

test('Normalize and load plugin from object', t => {
  // Call the normalize function with an object (with path property)
  const plugin = plugins.normalize({path: './src/lib/plugin-noop'});

  // Verify the plugin is loaded
  t.is(typeof plugin, 'function');
});

test('load from fallback', t => {
  // Call the normalize function with a fallback
  const plugin = plugins.normalize(null, '../lib/plugin-noop');

  // Verify the fallback plugin is loaded
  t.is(typeof plugin, 'function');
});

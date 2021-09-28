const test = require('ava');
const {gitRepo} = require('./helpers/git-utils');
const {outputJson, writeFile} = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const {stub} = require('sinon');
const proxyquire = require('proxyquire');
const normalizeConfig = require('../lib/normalize-config');

test.beforeEach((t) => {
  t.context.plugins = stub().returns({});
  t.context.getConfig = proxyquire('../lib/get-config', {'./plugins': t.context.plugins});
});

test('If plugins is of unexpected type, normalize should return them as is', (t) => {
  // If it is string
  const options = {
    plugins: 'ThisIsNotSupposedToBeAString',
  };
  const result = normalizeConfig(options);

  t.deepEqual(result, options);
  // If plugins is null
  t.deepEqual(normalizeConfig({plugins: null}), {plugins: null});
});

test('If the options is undefined/falsy, then the normalization function should return it as is', (t) => {
  t.is(normalizeConfig(false), false);
  t.is(normalizeConfig(undefined), undefined);
});

test('If the plugins is an Array, then the normalization function should return it as is', (t) => {
  const options = {
    plugins: ['ThisIsAPlugin'],
  };
  const result = normalizeConfig(options);
  t.deepEqual(result, options);
});

test('If the plugins is an Object, then the normalization function should change it into array format', (t) => {
  const options = {
    plugins: {
      ThisIsAPlugin: {
        andThis: 'Is the config',
      },
    },
  };
  const expected = {
    plugins: [['ThisIsAPlugin', {andThis: 'Is the config'}]],
  };
  const result = normalizeConfig(options);
  t.deepEqual(result, expected);
});

// These tests are mostly copy-paste from get-config.test.js, with slight modifications. Their intention is to test
// that the normalizing works in "real" situation.

test('Read options from package.json when plugins are an object', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const options = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    generateNotes: 'generateNotes',
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    tagFormat: `v\${version}`,
    plugins: {
      'plugin-1': {},
      'plugin-2': {plugin2Opt: 'value'},
    },
  };
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), {release: options});

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {...options, branches: ['test_branch'], plugins: ['plugin-1', ['plugin-2', {plugin2Opt: 'value'}]]};
  // Verify the options contains the plugin config from package.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from package.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
});

test('Read options from .releaserc.yml when plugins are an object', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const options = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    tagFormat: `v\${version}`,
    plugins: {
      'plugin-1': {},
      'plugin-2': {plugin2Opt: 'value'},
    },
  };
  // Create package.json in repository root
  await writeFile(path.resolve(cwd, '.releaserc.yml'), yaml.dump(options));

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {...options, branches: ['test_branch'], plugins: ['plugin-1', ['plugin-2', {plugin2Opt: 'value'}]]};
  // Verify the options contains the plugin config from package.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from package.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
});

test('Read options from .releaserc.json when plugins are an object', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const options = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    tagFormat: `v\${version}`,
    plugins: {
      'plugin-1': {},
      'plugin-2': {plugin2Opt: 'value'},
    },
  };
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, '.releaserc.json'), options);

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {...options, branches: ['test_branch'], plugins: ['plugin-1', ['plugin-2', {plugin2Opt: 'value'}]]};
  // Verify the options contains the plugin config from package.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from package.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
});

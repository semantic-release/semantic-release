import url from 'url';
import test from 'ava';
import {writeJson, writeFile} from 'fs-extra';
import proxyquire from 'proxyquire';
import {stub} from 'sinon';
import normalizeData from 'normalize-package-data';
import {gitRepo} from './helpers/git-utils';

test.beforeEach(t => {
  // Save the current process.env
  t.context.env = Object.assign({}, process.env);
  // Save the current working diretory
  t.context.cwd = process.cwd();
  t.context.plugins = stub().returns({});
  t.context.getConfig = proxyquire('../lib/get-config', {'./plugins': t.context.plugins});
});

test.afterEach.always(t => {
  // Restore the current working directory
  process.chdir(t.context.cwd);
  // Restore process.env
  process.env = Object.assign({}, t.context.env);
});

test.serial('Default values', async t => {
  const pkg = {name: 'package_name', release: {}};
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Create package.json in repository root
  await writeJson('./package.json', pkg);
  process.env.GH_TOKEN = 'GH_TOKEN';

  const result = await t.context.getConfig();

  // Verify the normalized package is returned
  normalizeData(pkg);
  t.deepEqual(result.pkg, pkg);
  // Verify the default options are set
  t.is(result.options.branch, 'master');
  t.is(result.options.githubToken, process.env.GH_TOKEN);
  // Verify the default npm options are set
  t.is(result.npm.tag, 'latest');

  // Use the environment variable npm_config_registry as the default so the test works on both npm and yarn
  t.is(result.npm.registry, url.format(url.parse(process.env.npm_config_registry || 'https://registry.npmjs.org/')));
});

test.serial('Read package.json configuration', async t => {
  const release = {
    analyzeCommits: 'analyzeCommits',
    generateNotes: 'generateNotes',
    getLastRelease: {
      path: 'getLastRelease',
      param: 'getLastRelease_param',
    },
    branch: 'test_branch',
  };
  const pkg = {name: 'package_name', release};

  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Create package.json in repository root
  await writeJson('./package.json', pkg);
  delete process.env.GH_TOKEN;
  process.env.GITHUB_TOKEN = 'GITHUB_TOKEN';

  const result = await t.context.getConfig();

  // Verify the options contains the plugin config from package.json
  t.is(result.options.analyzeCommits, release.analyzeCommits);
  t.is(result.options.generateNotes, release.generateNotes);
  t.deepEqual(result.options.getLastRelease, release.getLastRelease);
  t.is(result.options.branch, release.branch);

  // Verify the plugins module is called with the plugin options from package.json
  t.is(t.context.plugins.firstCall.args[0].analyzeCommits, release.analyzeCommits);
  t.is(t.context.plugins.firstCall.args[0].generateNotes, release.generateNotes);
  t.deepEqual(t.context.plugins.firstCall.args[0].getLastRelease, release.getLastRelease);
  t.is(t.context.plugins.firstCall.args[0].branch, release.branch);

  t.is(result.options.githubToken, process.env.GITHUB_TOKEN);
});

test.serial('Priority cli parameters over package.json configuration', async t => {
  const release = {
    analyzeCommits: 'analyzeCommits',
    generateNotes: 'generateNotes',
    getLastRelease: {
      path: 'getLastRelease',
      param: 'getLastRelease_pkg',
    },
    branch: 'branch_pkg',
  };
  const options = {
    getLastRelease: {
      path: 'getLastRelease',
      param: 'getLastRelease_cli',
    },
    branch: 'branch_cli',
  };
  const pkg = {name: 'package_name', release};

  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Create package.json in repository root
  await writeJson('./package.json', pkg);
  delete process.env.GH_TOKEN;
  process.env.GITHUB_TOKEN = 'GITHUB_TOKEN';

  const result = await t.context.getConfig(options);

  // Verify the options contains the plugin config from cli
  t.deepEqual(result.options.getLastRelease, options.getLastRelease);
  t.is(result.options.branch, options.branch);

  // Verify the plugins module is called with the plugin options from cli
  t.deepEqual(t.context.plugins.firstCall.args[0].getLastRelease, options.getLastRelease);
  t.is(t.context.plugins.firstCall.args[0].branch, options.branch);
});

test.serial('Get tag from .npmrc', async t => {
  const pkg = {name: 'package_name'};

  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Create package.json in repository root
  await writeJson('./package.json', pkg);
  // Create local .npmrc
  await writeFile('.npmrc', 'tag=npmrc_tag');

  // Make sure to not use the environment variable set by npm when running tests with npm run test
  delete process.env.npm_config_tag;
  const result = await t.context.getConfig();

  // Verify the tag used in the one in .npmrc
  t.is(result.npm.tag, 'npmrc_tag');
});

test.serial('Get tag from package.json, even if defined in .npmrc', async t => {
  const publishConfig = {tag: 'pkg_tag'};
  const pkg = {name: 'package_name', publishConfig};

  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Create package.json in repository root
  await writeJson('./package.json', pkg);
  // Create local .npmrc
  await writeFile('.npmrc', 'tag=npmrc_tag');

  const result = await t.context.getConfig();

  // Verify the tag used in the one in package.json
  t.is(result.npm.tag, 'pkg_tag');
});

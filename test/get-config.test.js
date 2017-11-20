import test from 'ava';
import {writeJson} from 'fs-extra';
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

  const result = await t.context.getConfig();

  // Verify the normalized package is returned
  normalizeData(pkg);
  t.deepEqual(result.pkg, pkg);
  // Verify the default options are set
  t.is(result.options.branch, 'master');
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
});

test.serial('Prioritise cli parameters over package.json configuration', async t => {
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

  const result = await t.context.getConfig(options);

  // Verify the options contains the plugin config from cli
  t.deepEqual(result.options.getLastRelease, options.getLastRelease);
  t.is(result.options.branch, options.branch);

  // Verify the plugins module is called with the plugin options from cli
  t.deepEqual(t.context.plugins.firstCall.args[0].getLastRelease, options.getLastRelease);
  t.is(t.context.plugins.firstCall.args[0].branch, options.branch);
});

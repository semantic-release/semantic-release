import test from 'ava';
import {writeFile, writeJson} from 'fs-extra';
import proxyquire from 'proxyquire';
import {stub} from 'sinon';
import yaml from 'js-yaml';
import {gitRepo, gitCommits, gitShallowClone, gitAddConfig} from './helpers/git-utils';

// Save the current process.env
const envBackup = Object.assign({}, process.env);
// Save the current working diretory
const cwd = process.cwd();

test.beforeEach(t => {
  t.context.plugins = stub().returns({});
  t.context.getConfig = proxyquire('../lib/get-config', {'./plugins': t.context.plugins});
});

test.afterEach.always(() => {
  // Restore process.env
  process.env = envBackup;
  // Restore the current working directory
  process.chdir(cwd);
});

test.serial('Default values, reading repositoryUrl from package.json', async t => {
  const pkg = {repository: 'git@package.com:owner/module.git'};
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  await gitCommits(['First']);
  // Add remote.origin.url config
  await gitAddConfig('remote.origin.url', 'git@repo.com:owner/module.git');
  // Create package.json in repository root
  await writeJson('./package.json', pkg);

  const {options} = await t.context.getConfig();

  // Verify the default options are set
  t.is(options.branch, 'master');
  t.is(options.repositoryUrl, 'git@package.com:owner/module.git');
});

test.serial('Default values, reading repositoryUrl from repo if not set in package.json', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add remote.origin.url config
  await gitAddConfig('remote.origin.url', 'git@repo.com:owner/module.git');

  const {options} = await t.context.getConfig();

  // Verify the default options are set
  t.is(options.branch, 'master');
  t.is(options.repositoryUrl, 'git@repo.com:owner/module.git');
});

test.serial('Default values, reading repositoryUrl (http url) from package.json if not set in repo', async t => {
  const pkg = {repository: 'git+https://hostname.com/owner/module.git'};
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Create package.json in repository root
  await writeJson('./package.json', pkg);

  const {options} = await t.context.getConfig();

  // Verify the default options are set
  t.is(options.branch, 'master');
  t.is(options.repositoryUrl, pkg.repository);
});

test.serial('Read options from package.json', async t => {
  const release = {
    analyzeCommits: 'analyzeCommits',
    generateNotes: 'generateNotes',
    getLastRelease: {path: 'getLastRelease', param: 'getLastRelease_param'},
    branch: 'test_branch',
    repositoryUrl: 'git+https://hostname.com/owner/module.git',
  };

  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Create package.json in repository root
  await writeJson('./package.json', {release});

  const {options} = await t.context.getConfig();

  // Verify the options contains the plugin config from package.json
  t.deepEqual(options, release);
  // Verify the plugins module is called with the plugin options from package.json
  t.deepEqual(t.context.plugins.args[0][0], release);
});

test.serial('Read options from .releaserc.yml', async t => {
  const release = {
    getLastRelease: {path: 'getLastRelease', param: 'getLastRelease_param'},
    branch: 'test_branch',
    repositoryUrl: 'git+https://hostname.com/owner/module.git',
  };

  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Create package.json in repository root
  await writeFile('.releaserc.yml', yaml.safeDump(release));

  const {options} = await t.context.getConfig();

  // Verify the options contains the plugin config from package.json
  t.deepEqual(options, release);
  // Verify the plugins module is called with the plugin options from package.json
  t.deepEqual(t.context.plugins.args[0][0], release);
});

test.serial('Read options from .releaserc.json', async t => {
  const release = {
    getLastRelease: {path: 'getLastRelease', param: 'getLastRelease_param'},
    branch: 'test_branch',
    repositoryUrl: 'git+https://hostname.com/owner/module.git',
  };

  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Create package.json in repository root
  await writeJson('.releaserc.json', release);

  const {options} = await t.context.getConfig();

  // Verify the options contains the plugin config from package.json
  t.deepEqual(options, release);
  // Verify the plugins module is called with the plugin options from package.json
  t.deepEqual(t.context.plugins.args[0][0], release);
});

test.serial('Read options from .releaserc.js', async t => {
  const release = {
    getLastRelease: {path: 'getLastRelease', param: 'getLastRelease_param'},
    branch: 'test_branch',
    repositoryUrl: 'git+https://hostname.com/owner/module.git',
  };

  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Create package.json in repository root
  await writeFile('.releaserc.js', `module.exports = ${JSON.stringify(release)}`);

  const {options} = await t.context.getConfig();

  // Verify the options contains the plugin config from package.json
  t.deepEqual(options, release);
  // Verify the plugins module is called with the plugin options from package.json
  t.deepEqual(t.context.plugins.args[0][0], release);
});

test.serial('Read options from release.config.js', async t => {
  const release = {
    getLastRelease: {path: 'getLastRelease', param: 'getLastRelease_param'},
    branch: 'test_branch',
    repositoryUrl: 'git+https://hostname.com/owner/module.git',
  };

  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Create package.json in repository root
  await writeFile('release.config.js', `module.exports = ${JSON.stringify(release)}`);

  const {options} = await t.context.getConfig();

  // Verify the options contains the plugin config from package.json
  t.deepEqual(options, release);
  // Verify the plugins module is called with the plugin options from package.json
  t.deepEqual(t.context.plugins.args[0][0], release);
});

test.serial('Prioritise cli parameters over file configuration and git repo', async t => {
  const release = {
    getLastRelease: {path: 'getLastRelease', param: 'getLastRelease_pkg'},
    branch: 'branch_pkg',
  };
  const options = {
    getLastRelease: {path: 'getLastRelease', param: 'getLastRelease_cli'},
    branch: 'branch_cli',
    repositoryUrl: 'http://cli-url.com/owner/package',
  };
  const pkg = {release, repository: 'git@hostname.com:owner/module.git'};
  // Create a git repository, set the current working directory at the root of the repo
  const repo = await gitRepo();
  await gitCommits(['First']);
  // Create a clone
  await gitShallowClone(repo);
  // Create package.json in repository root
  await writeJson('./package.json', pkg);

  const result = await t.context.getConfig(options);

  // Verify the options contains the plugin config from cli
  t.deepEqual(result.options, options);
  // Verify the plugins module is called with the plugin options from cli
  t.deepEqual(t.context.plugins.args[0][0], options);
});

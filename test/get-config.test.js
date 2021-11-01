const path = require('path');
const {format} = require('util');
const test = require('ava');
const {writeFile, outputJson} = require('fs-extra');
const {omit} = require('lodash');
const proxyquire = require('proxyquire');
const {stub} = require('sinon');
const yaml = require('js-yaml');
const {gitRepo, gitTagVersion, gitCommits, gitShallowClone, gitAddConfig} = require('./helpers/git-utils');

const DEFAULT_PLUGINS = [
  '@semantic-release/commit-analyzer',
  '@semantic-release/release-notes-generator',
  '@semantic-release/npm',
  '@semantic-release/github',
];

test.beforeEach((t) => {
  t.context.plugins = stub().returns({});
  t.context.getConfig = proxyquire('../lib/get-config', {'./plugins': t.context.plugins});
});

test('Default values, reading repositoryUrl from package.json', async (t) => {
  const pkg = {repository: 'https://host.null/owner/package.git'};
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo(true);
  await gitCommits(['First'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitTagVersion('v1.1.0', undefined, {cwd});
  // Add remote.origin.url config
  await gitAddConfig('remote.origin.url', 'git@host.null:owner/repo.git', {cwd});
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), pkg);

  const {options: result} = await t.context.getConfig({cwd});

  // Verify the default options are set
  t.deepEqual(result.branches, [
    '+([0-9])?(.{+([0-9]),x}).x',
    'master',
    'next',
    'next-major',
    {name: 'beta', prerelease: true},
    {name: 'alpha', prerelease: true},
  ]);
  t.is(result.repositoryUrl, 'https://host.null/owner/package.git');
  t.is(result.tagFormat, `v\${version}`);
});

test('Default values, reading repositoryUrl from repo if not set in package.json', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo(true);
  // Add remote.origin.url config
  await gitAddConfig('remote.origin.url', 'https://host.null/owner/module.git', {cwd});

  const {options: result} = await t.context.getConfig({cwd});

  // Verify the default options are set
  t.deepEqual(result.branches, [
    '+([0-9])?(.{+([0-9]),x}).x',
    'master',
    'next',
    'next-major',
    {name: 'beta', prerelease: true},
    {name: 'alpha', prerelease: true},
  ]);
  t.is(result.repositoryUrl, 'https://host.null/owner/module.git');
  t.is(result.tagFormat, `v\${version}`);
});

test('Default values, reading repositoryUrl (http url) from package.json if not set in repo', async (t) => {
  const pkg = {repository: 'https://host.null/owner/module.git'};
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), pkg);

  const {options: result} = await t.context.getConfig({cwd});

  // Verify the default options are set
  t.deepEqual(result.branches, [
    '+([0-9])?(.{+([0-9]),x}).x',
    'master',
    'next',
    'next-major',
    {name: 'beta', prerelease: true},
    {name: 'alpha', prerelease: true},
  ]);
  t.is(result.repositoryUrl, 'https://host.null/owner/module.git');
  t.is(result.tagFormat, `v\${version}`);
});

test('Convert "ci" option to "noCi"', async (t) => {
  const pkg = {repository: 'https://host.null/owner/module.git', release: {ci: false}};
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), pkg);

  const {options: result} = await t.context.getConfig({cwd});

  t.is(result.noCi, true);
});

test('Read options from package.json', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const options = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    generateNotes: 'generateNotes',
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), {release: options});

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {...options, branches: ['test_branch']};
  // Verify the options contains the plugin config from package.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from package.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
});

test('Read options from .releaserc.yml', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const options = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json in repository root
  await writeFile(path.resolve(cwd, '.releaserc.yml'), yaml.dump(options));

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {...options, branches: ['test_branch']};
  // Verify the options contains the plugin config from package.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from package.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
});

test('Read options from .releaserc.json', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const options = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, '.releaserc.json'), options);

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {...options, branches: ['test_branch']};
  // Verify the options contains the plugin config from package.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from package.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
});

test('Read options from .releaserc.js', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const options = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json in repository root
  await writeFile(path.resolve(cwd, '.releaserc.js'), `module.exports = ${JSON.stringify(options)}`);

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {...options, branches: ['test_branch']};
  // Verify the options contains the plugin config from package.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from package.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
});

test('Read options from .releaserc.cjs', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const options = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create .releaserc.cjs in repository root
  await writeFile(path.resolve(cwd, '.releaserc.cjs'), `module.exports = ${JSON.stringify(options)}`);

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {...options, branches: ['test_branch']};
  // Verify the options contains the plugin config from .releaserc.cjs
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from .releaserc.cjs
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
});

test('Read options from release.config.js', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const options = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json in repository root
  await writeFile(path.resolve(cwd, 'release.config.js'), `module.exports = ${JSON.stringify(options)}`);

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {...options, branches: ['test_branch']};
  // Verify the options contains the plugin config from package.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from package.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
});

test('Read options from release.config.cjs', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const options = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create release.config.cjs in repository root
  await writeFile(path.resolve(cwd, 'release.config.cjs'), `module.exports = ${JSON.stringify(options)}`);

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {...options, branches: ['test_branch']};
  // Verify the options contains the plugin config from release.config.cjs
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from release.config.cjs
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
});

test('Prioritise CLI/API parameters over file configuration and git repo', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  let {cwd, repositoryUrl} = await gitRepo();
  await gitCommits(['First'], {cwd});
  // Create a clone
  cwd = await gitShallowClone(repositoryUrl);
  const pkgOptions = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_pkg'},
    branches: ['branch_pkg'],
  };
  const options = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_cli'},
    branches: ['branch_cli'],
    repositoryUrl: 'http://cli-url.com/owner/package',
    tagFormat: `cli\${version}`,
    plugins: false,
  };
  const pkg = {release: pkgOptions, repository: 'git@host.null:owner/module.git'};
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), pkg);

  const result = await t.context.getConfig({cwd}, options);

  const expected = {...options, branches: ['branch_cli']};
  // Verify the options contains the plugin config from CLI/API
  t.deepEqual(result.options, expected);
  // Verify the plugins module is called with the plugin options from CLI/API
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
});

test('Read configuration from file path in "extends"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const pkgOptions = {extends: './shareable.json'};
  const options = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    generateNotes: 'generateNotes',
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    tagFormat: `v\${version}`,
    plugins: ['plugin-1', ['plugin-2', {plugin2Opt: 'value'}]],
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), {release: pkgOptions});
  await outputJson(path.resolve(cwd, 'shareable.json'), options);

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {...options, branches: ['test_branch']};
  // Verify the options contains the plugin config from shareable.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from shareable.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
  t.deepEqual(t.context.plugins.args[0][1], {
    analyzeCommits: './shareable.json',
    generateNotes: './shareable.json',
    'plugin-1': './shareable.json',
    'plugin-2': './shareable.json',
  });
});

test('Read configuration from module path in "extends"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const pkgOptions = {extends: 'shareable'};
  const options = {
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    generateNotes: 'generateNotes',
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), {release: pkgOptions});
  await outputJson(path.resolve(cwd, 'node_modules/shareable/index.json'), options);

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {...options, branches: ['test_branch']};
  // Verify the options contains the plugin config from shareable.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from shareable.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
  t.deepEqual(t.context.plugins.args[0][1], {
    analyzeCommits: 'shareable',
    generateNotes: 'shareable',
  });
});

test('Read configuration from an array of paths in "extends"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const pkgOptions = {extends: ['./shareable1.json', './shareable2.json']};
  const options1 = {
    verifyRelease: 'verifyRelease1',
    analyzeCommits: {path: 'analyzeCommits1', param: 'analyzeCommits_param1'},
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
  };
  const options2 = {
    verifyRelease: 'verifyRelease2',
    generateNotes: 'generateNotes2',
    analyzeCommits: {path: 'analyzeCommits2', param: 'analyzeCommits_param2'},
    branches: ['test_branch'],
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), {release: pkgOptions});
  await outputJson(path.resolve(cwd, 'shareable1.json'), options1);
  await outputJson(path.resolve(cwd, 'shareable2.json'), options2);

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {...options1, ...options2, branches: ['test_branch']};
  // Verify the options contains the plugin config from shareable1.json and shareable2.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from shareable1.json and shareable2.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
  t.deepEqual(t.context.plugins.args[0][1], {
    verifyRelease1: './shareable1.json',
    verifyRelease2: './shareable2.json',
    generateNotes2: './shareable2.json',
    analyzeCommits1: './shareable1.json',
    analyzeCommits2: './shareable2.json',
  });
});

test('Prioritize configuration from config file over "extends"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const pkgOptions = {
    extends: './shareable.json',
    branches: ['test_pkg'],
    generateNotes: 'generateNotes',
    publish: [{path: 'publishPkg', param: 'publishPkg_param'}],
  };
  const options1 = {
    analyzeCommits: 'analyzeCommits',
    generateNotes: 'generateNotesShareable',
    publish: [{path: 'publishShareable', param: 'publishShareable_param'}],
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), {release: pkgOptions});
  await outputJson(path.resolve(cwd, 'shareable.json'), options1);

  const {options: result} = await t.context.getConfig({cwd});

  const expected = omit({...options1, ...pkgOptions, branches: ['test_pkg']}, 'extends');
  // Verify the options contains the plugin config from package.json and shareable.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from package.json and shareable.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
  t.deepEqual(t.context.plugins.args[0][1], {
    analyzeCommits: './shareable.json',
    generateNotesShareable: './shareable.json',
    publishShareable: './shareable.json',
  });
});

test('Prioritize configuration from cli/API options over "extends"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const cliOptions = {
    extends: './shareable2.json',
    branches: ['branch_opts'],
    publish: [{path: 'publishOpts', param: 'publishOpts_param'}],
    repositoryUrl: 'https://host.null/owner/module.git',
  };
  const pkgOptions = {
    extends: './shareable1.json',
    branches: ['branch_pkg'],
    generateNotes: 'generateNotes',
    publish: [{path: 'publishPkg', param: 'publishPkg_param'}],
  };
  const options1 = {
    analyzeCommits: 'analyzeCommits1',
    generateNotes: 'generateNotesShareable1',
    publish: [{path: 'publishShareable', param: 'publishShareable_param1'}],
    branches: ['test_branch1'],
    repositoryUrl: 'https://host.null/owner/module.git',
  };
  const options2 = {
    analyzeCommits: 'analyzeCommits2',
    publish: [{path: 'publishShareable', param: 'publishShareable_param2'}],
    branches: ['test_branch2'],
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json, shareable1.json and shareable2.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), {release: pkgOptions});
  await outputJson(path.resolve(cwd, 'shareable1.json'), options1);
  await outputJson(path.resolve(cwd, 'shareable2.json'), options2);

  const {options: result} = await t.context.getConfig({cwd}, cliOptions);

  const expected = omit({...options2, ...pkgOptions, ...cliOptions, branches: ['branch_opts']}, 'extends');
  // Verify the options contains the plugin config from package.json and shareable2.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from package.json and shareable2.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
});

test('Allow to unset properties defined in shareable config with "null"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const pkgOptions = {
    extends: './shareable.json',
    analyzeCommits: null,
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
    plugins: null,
  };
  const options1 = {
    generateNotes: 'generateNotes',
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    tagFormat: `v\${version}`,
    plugins: ['test-plugin'],
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), {release: pkgOptions});
  await outputJson(path.resolve(cwd, 'shareable.json'), options1);

  const {options} = await t.context.getConfig({cwd});

  // Verify the options contains the plugin config from shareable.json and the default `plugins`
  t.deepEqual(options, {
    ...omit(options1, ['analyzeCommits']),
    ...omit(pkgOptions, ['extends', 'analyzeCommits']),
    plugins: DEFAULT_PLUGINS,
  });
  // Verify the plugins module is called with the plugin options from shareable.json and the default `plugins`
  t.deepEqual(t.context.plugins.args[0][0], {
    options: {
      ...omit(options1, 'analyzeCommits'),
      ...omit(pkgOptions, ['extends', 'analyzeCommits']),
      plugins: DEFAULT_PLUGINS,
    },
    cwd,
  });

  t.deepEqual(t.context.plugins.args[0][1], {
    generateNotes: './shareable.json',
    analyzeCommits: './shareable.json',
    'test-plugin': './shareable.json',
  });
});

test('Allow to unset properties defined in shareable config with "undefined"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const pkgOptions = {
    extends: './shareable.json',
    analyzeCommits: undefined,
    branches: ['test_branch'],
    repositoryUrl: 'https://host.null/owner/module.git',
  };
  const options1 = {
    generateNotes: 'generateNotes',
    analyzeCommits: {path: 'analyzeCommits', param: 'analyzeCommits_param'},
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json and release.config.js in repository root
  await writeFile(path.resolve(cwd, 'release.config.js'), `module.exports = ${format(pkgOptions)}`);
  await outputJson(path.resolve(cwd, 'shareable.json'), options1);

  const {options: result} = await t.context.getConfig({cwd});

  const expected = {
    ...omit(options1, 'analyzeCommits'),
    ...omit(pkgOptions, ['extends', 'analyzeCommits']),
    branches: ['test_branch'],
  };
  // Verify the options contains the plugin config from shareable.json
  t.deepEqual(result, expected);
  // Verify the plugins module is called with the plugin options from shareable.json
  t.deepEqual(t.context.plugins.args[0][0], {options: expected, cwd});
  t.deepEqual(t.context.plugins.args[0][1], {
    generateNotes: './shareable.json',
    analyzeCommits: './shareable.json',
  });
});

test('Throw an Error if one of the shareable config cannot be found', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const pkgOptions = {extends: ['./shareable1.json', 'non-existing-path']};
  const options1 = {analyzeCommits: 'analyzeCommits'};
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), {release: pkgOptions});
  await outputJson(path.resolve(cwd, 'shareable1.json'), options1);

  await t.throwsAsync(t.context.getConfig({cwd}), {
    message: /Cannot find module 'non-existing-path'/,
    code: 'MODULE_NOT_FOUND',
  });
});

test('Convert "ci" option to "noCi" when set from extended config', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const pkgOptions = {extends: './no-ci.json'};
  const options = {
    ci: false,
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, 'package.json'), {release: pkgOptions});
  await outputJson(path.resolve(cwd, 'no-ci.json'), options);

  const {options: result} = await t.context.getConfig({cwd});

  t.is(result.ci, false);
  t.is(result.noCi, true);
});

import test from 'ava';
import {writeJson, readJson} from 'fs-extra';
import {stub} from 'sinon';
import execa from 'execa';
import {gitHead as getGitHead, gitTagHead, gitRepo, gitCommits, gitRemoteTagHead} from './helpers/git-utils';
import gitbox from './helpers/gitbox';
import mockServer from './helpers/mockserver';
import npmRegistry from './helpers/npm-registry';
import semanticRelease from '..';

/* eslint camelcase: ["error", {properties: "never"}] */

// Environment variables used with semantic-release cli (similar to what a user would setup)
const env = {
  GH_TOKEN: gitbox.gitCredential,
  GITHUB_URL: mockServer.url,
  NPM_EMAIL: 'integration@test.com',
  NPM_USERNAME: 'integration',
  NPM_PASSWORD: 'suchsecure',
};
// Environment variables used only for the local npm command used to do verification
const testEnv = Object.assign({}, process.env, {
  npm_config_registry: npmRegistry.url,
  NPM_EMAIL: 'integration@test.com',
  LEGACY_TOKEN: Buffer.from(`${process.env.NPM_USERNAME}:${process.env.NPM_PASSWORD}`, 'utf8').toString('base64'),
});
// Save the current process.env
const envBackup = Object.assign({}, process.env);
const cli = require.resolve('../bin/semantic-release');
const pluginError = require.resolve('./fixtures/plugin-error');
const pluginInheritedError = require.resolve('./fixtures/plugin-error-inherited');
// Save the current working diretory
const cwd = process.cwd();
// Disable logs during tests
stub(process.stdout, 'write');
stub(process.stderr, 'write');

test.before(async () => {
  // Start the Git server
  await gitbox.start();
  // Start the local NPM registry
  await npmRegistry.start();
  // Start Mock Server
  await mockServer.start();
});

test.beforeEach(() => {
  // Delete environment variables that could have been set on the machine running the tests
  delete process.env.NPM_TOKEN;
  delete process.env.NPM_USERNAME;
  delete process.env.NPM_PASSWORD;
  delete process.env.NPM_EMAIL;
  delete process.env.GH_URL;
  delete process.env.GITHUB_URL;
  delete process.env.GH_PREFIX;
  delete process.env.GITHUB_PREFIX;
  delete process.env.GIT_CREDENTIALS;
  delete process.env.GH_TOKEN;
  delete process.env.GITHUB_TOKEN;
  delete process.env.GL_TOKEN;
  delete process.env.GITLAB_TOKEN;

  process.env.TRAVIS = 'true';
  process.env.CI = 'true';
  process.env.TRAVIS_BRANCH = 'master';
  process.env.TRAVIS_PULL_REQUEST = 'false';

  // Delete all `npm_config` environment variable set by CI as they take precedence over the `.npmrc` because the process that runs the tests is started before the `.npmrc` is created
  for (let i = 0, keys = Object.keys(process.env); i < keys.length; i++) {
    if (keys[i].startsWith('npm_')) {
      delete process.env[keys[i]];
    }
  }
});

test.afterEach.always(() => {
  // Restore process.env
  process.env = envBackup;
  // Restore the current working directory
  process.chdir(cwd);
});

test.after.always(async () => {
  // Stop the Git server
  await gitbox.stop();
  // Stop the local NPM registry
  await npmRegistry.stop();
  // Stop Mock Server
  await mockServer.stop();
});

test.serial('Release patch, minor and major versions', async t => {
  const packageName = 'test-release';
  const owner = 'git';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository and package.json');
  const {repositoryUrl, authUrl} = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: repositoryUrl},
    publishConfig: {registry: npmRegistry.url},
    release: {success: false, fail: false},
  });
  // Create a npm-shrinkwrap.json file
  await execa('npm', ['shrinkwrap'], {env: testEnv});

  /* No release */

  let verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  t.log('Commit a chore');
  await gitCommits(['chore: Init repository']);
  t.log('$ semantic-release');
  let {stdout, code} = await execa(cli, [], {env});
  t.regex(stdout, /There are no relevant changes, so no new version is released/);
  t.is(code, 0);

  /* Initial release */
  let version = '1.0.0';
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  let createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: {tag_name: `v${version}`, target_commitish: 'master', name: `v${version}`},
      headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}],
    },
    {body: {html_url: `release-url/${version}`}}
  );

  t.log('Commit a feature');
  await gitCommits(['feat: Initial commit']);
  t.log('$ semantic-release');
  ({stdout, code} = await execa(cli, [], {env}));
  t.regex(stdout, new RegExp(`Published GitHub release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, version);
  t.is((await readJson('./npm-shrinkwrap.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  let [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env: testEnv})).stdout
  );
  let gitHead = await getGitHead();
  t.is(releasedVersion, version);
  t.is(releasedGitHead, gitHead);
  t.is(await gitTagHead(`v${version}`), gitHead);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`), gitHead);
  t.log(`+ released ${releasedVersion} with gitHead ${releasedGitHead}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createReleaseMock);

  /* Patch release */
  version = '1.0.1';
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: {tag_name: `v${version}`, target_commitish: 'master', name: `v${version}`},
      headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}],
    },
    {body: {html_url: `release-url/${version}`}}
  );

  t.log('Commit a fix');
  await gitCommits(['fix: bar']);
  t.log('$ semantic-release');
  ({stdout, code} = await execa(cli, [], {env}));
  t.regex(stdout, new RegExp(`Published GitHub release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, version);
  t.is((await readJson('./npm-shrinkwrap.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env: testEnv})).stdout
  );
  gitHead = await getGitHead();
  t.is(releasedVersion, version);
  t.is(releasedGitHead, gitHead);
  t.is(await gitTagHead(`v${version}`), gitHead);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`), gitHead);
  t.log(`+ released ${releasedVersion} with gitHead ${releasedGitHead}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createReleaseMock);

  /* Minor release */
  version = '1.1.0';
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: {tag_name: `v${version}`, target_commitish: 'master', name: `v${version}`},
      headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}],
    },
    {body: {html_url: `release-url/${version}`}}
  );

  t.log('Commit a feature');
  await gitCommits(['feat: baz']);
  t.log('$ semantic-release');
  ({stdout, code} = await execa(cli, [], {env}));
  t.regex(stdout, new RegExp(`Published GitHub release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, version);
  t.is((await readJson('./npm-shrinkwrap.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env: testEnv})).stdout
  );
  gitHead = await getGitHead();
  t.is(releasedVersion, version);
  t.is(releasedGitHead, gitHead);
  t.is(await gitTagHead(`v${version}`), gitHead);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`), gitHead);
  t.log(`+ released ${releasedVersion} with gitHead ${releasedGitHead}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createReleaseMock);

  /* Major release */
  version = '2.0.0';
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: {tag_name: `v${version}`, target_commitish: 'master', name: `v${version}`},
      headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}],
    },
    {body: {html_url: `release-url/${version}`}}
  );

  t.log('Commit a breaking change');
  await gitCommits(['feat: foo\n\n BREAKING CHANGE: bar']);
  t.log('$ semantic-release');
  ({stdout, code} = await execa(cli, [], {env}));
  t.regex(stdout, new RegExp(`Published GitHub release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, version);
  t.is((await readJson('./npm-shrinkwrap.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env: testEnv})).stdout
  );
  gitHead = await getGitHead();
  t.is(releasedVersion, version);
  t.is(releasedGitHead, gitHead);
  t.is(await gitTagHead(`v${version}`), gitHead);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`), gitHead);
  t.log(`+ released ${releasedVersion} with gitHead ${releasedGitHead}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createReleaseMock);
});

test.serial('Exit with 1 if a plugin is not found', async t => {
  const packageName = 'test-plugin-not-found';
  const owner = 'test-repo';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository');
  await gitRepo();
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: `git+https://github.com/${owner}/${packageName}`},
    release: {analyzeCommits: 'non-existing-path', success: false, fail: false},
  });

  const {code, stderr} = await t.throws(execa(cli, [], {env}));
  t.is(code, 1);
  t.regex(stderr, /Cannot find module/);
});

test.serial('Exit with 1 if a shareable config is not found', async t => {
  const packageName = 'test-config-not-found';
  const owner = 'test-repo';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository');
  await gitRepo();
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: `git+https://github.com/${owner}/${packageName}`},
    release: {extends: 'non-existing-path', success: false, fail: false},
  });

  const {code, stderr} = await t.throws(execa(cli, [], {env}));
  t.is(code, 1);
  t.regex(stderr, /Cannot find module/);
});

test.serial('Exit with 1 if a shareable config reference a not found plugin', async t => {
  const packageName = 'test-config-ref-not-found';
  const owner = 'test-repo';
  const shareable = {analyzeCommits: 'non-existing-path'};

  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository');
  await gitRepo();
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: `git+https://github.com/${owner}/${packageName}`},
    release: {extends: './shareable.json', success: false, fail: false},
  });
  await writeJson('./shareable.json', shareable);

  const {code, stderr} = await t.throws(execa(cli, [], {env}));
  t.is(code, 1);
  t.regex(stderr, /Cannot find module/);
});

test.serial('Dry-run', async t => {
  const packageName = 'test-dry-run';
  const owner = 'git';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository and package.json');
  const {repositoryUrl} = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: repositoryUrl},
    publishConfig: {registry: npmRegistry.url},
    release: {success: false, fail: false},
  });

  /* Initial release */
  const verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  const version = '1.0.0';
  t.log('Commit a feature');
  await gitCommits(['feat: Initial commit']);
  t.log('$ semantic-release -d');
  const {stdout, code} = await execa(cli, ['-d'], {env});
  t.regex(stdout, new RegExp(`There is no previous release, the next release version is ${version}`));
  t.regex(stdout, new RegExp(`Release note for version ${version}`));
  t.regex(stdout, /Initial commit/);
  t.is(code, 0);

  // Verify package.json and has not been modified
  t.is((await readJson('./package.json')).version, '0.0.0-dev');
  await mockServer.verify(verifyMock);
});

test.serial('Allow local releases with "noCi" option', async t => {
  delete process.env.TRAVIS;
  delete process.env.CI;
  const packageName = 'test-no-ci';
  const owner = 'git';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository and package.json');
  const {repositoryUrl, authUrl} = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: repositoryUrl},
    publishConfig: {registry: npmRegistry.url},
    release: {success: false, fail: false},
  });

  /* Initial release */
  const version = '1.0.0';
  const verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  const createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: {tag_name: `v${version}`, target_commitish: 'master', name: `v${version}`},
      headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}],
    },
    {body: {html_url: `release-url/${version}`}}
  );

  t.log('Commit a feature');
  await gitCommits(['feat: Initial commit']);
  t.log('$ semantic-release --no-ci');
  const {stdout, code} = await execa(cli, ['--no-ci'], {env});
  t.regex(stdout, new RegExp(`Published GitHub release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);

  // Verify package.json and has been updated
  t.is((await readJson('./package.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  const [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env: testEnv})).stdout
  );

  const gitHead = await getGitHead();
  t.is(releasedVersion, version);
  t.is(releasedGitHead, gitHead);
  t.is(await gitTagHead(`v${version}`), gitHead);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`), gitHead);
  t.log(`+ released ${releasedVersion} with gitHead ${releasedGitHead}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createReleaseMock);
});

test.serial('Pass options via CLI arguments', async t => {
  const packageName = 'test-cli';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository and package.json');
  const {repositoryUrl, authUrl} = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: repositoryUrl},
    publishConfig: {registry: npmRegistry.url},
  });

  /* Initial release */
  const version = '1.0.0';
  t.log('Commit a feature');
  await gitCommits(['feat: Initial commit']);
  t.log('$ semantic-release');
  const {stdout, code} = await execa(
    cli,
    [
      '--verify-conditions',
      '@semantic-release/npm',
      '--publish',
      '@semantic-release/npm',
      `--success`,
      false,
      `--fail`,
      false,
      '--debug',
    ],
    {env}
  );
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);

  // Verify package.json and has been updated
  t.is((await readJson('./package.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  const [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env: testEnv})).stdout
  );
  const gitHead = await getGitHead();
  t.is(releasedVersion, version);
  t.is(releasedGitHead, gitHead);
  t.is(await gitTagHead(`v${version}`), gitHead);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`), gitHead);
  t.log(`+ released ${releasedVersion} with gitHead ${releasedGitHead}`);
});

test.serial('Run via JS API', async t => {
  const packageName = 'test-js-api';
  const owner = 'git';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository and package.json');
  const {repositoryUrl, authUrl} = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: repositoryUrl},
    publishConfig: {registry: npmRegistry.url},
  });

  /* Initial release */
  const version = '1.0.0';
  const verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  const createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: {tag_name: `v${version}`, target_commitish: 'master', name: `v${version}`},
      headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}],
    },
    {body: {html_url: `release-url/${version}`}}
  );

  process.env = Object.assign(process.env, env);

  t.log('Commit a feature');
  await gitCommits(['feat: Initial commit']);
  t.log('$ Call semantic-release via API');
  await semanticRelease({fail: false, success: false});

  // Verify package.json and has been updated
  t.is((await readJson('./package.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  const [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env: testEnv})).stdout
  );
  const gitHead = await getGitHead();
  t.is(releasedVersion, version);
  t.is(releasedGitHead, gitHead);
  t.is(await gitTagHead(`v${version}`), gitHead);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`), gitHead);
  t.log(`+ released ${releasedVersion} with gitHead ${releasedGitHead}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createReleaseMock);
});

test.serial('Log unexpected errors from plugins and exit with 1', async t => {
  const packageName = 'test-unexpected-error';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository and package.json');
  const {repositoryUrl} = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: repositoryUrl},
    release: {verifyConditions: pluginError, fail: false, success: false},
  });

  /* Initial release */
  t.log('Commit a feature');
  await gitCommits(['feat: Initial commit']);
  t.log('$ semantic-release');
  const {stderr, code} = await execa(cli, [], {env, reject: false});
  // Verify the type and message are logged
  t.regex(stderr, /Error: a/);
  // Verify the the stacktrace is logged
  t.regex(stderr, new RegExp(pluginError));
  // Verify the Error properties are logged
  t.regex(stderr, /errorProperty: 'errorProperty'/);
  t.is(code, 1);
});

test.serial('Log errors inheriting SemanticReleaseError and exit with 1', async t => {
  const packageName = 'test-inherited-error';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository and package.json');
  const {repositoryUrl} = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: repositoryUrl},
    release: {verifyConditions: pluginInheritedError, fail: false, success: false},
  });

  /* Initial release */
  t.log('Commit a feature');
  await gitCommits(['feat: Initial commit']);
  t.log('$ semantic-release');
  const {stdout, code} = await execa(cli, [], {env, reject: false});
  // Verify the type and message are logged
  t.regex(stdout, /EINHERITED Inherited error/);
  t.is(code, 1);
});

test.serial('Exit with 1 if missing permission to push to the remote repository', async t => {
  const packageName = 'unauthorized';

  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository');
  const {repositoryUrl} = await gitbox.createRepo(packageName);
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: repositoryUrl},
  });

  /* Initial release */
  t.log('Commit a feature');
  await gitCommits(['feat: Initial commit']);
  t.log('$ semantic-release');
  const {stdout, code} = await execa(cli, [], {env: {...env, ...{GH_TOKEN: 'user:wrong_pass'}}, reject: false});
  // Verify the type and message are logged
  t.regex(stdout, /EGITNOPERMISSION/);
  t.is(code, 1);
});

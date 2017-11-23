import test from 'ava';
import {writeJson, readJson} from 'fs-extra';
import {stub} from 'sinon';
import execa from 'execa';
import {gitRepo, gitCommits, gitHead, gitTagVersion, gitPackRefs, gitAmmendCommit} from './helpers/git-utils';
import registry from './helpers/registry';
import mockServer from './helpers/mockserver';
import semanticRelease from '..';

/* eslint camelcase: ["error", {properties: "never"}] */

// Environment variables used with cli
const env = {
  npm_config_registry: registry.uri,
  GH_TOKEN: 'github_token',
  GITHUB_URL: mockServer.url,
  NPM_EMAIL: 'integration@test.com',
  NPM_USERNAME: 'integration',
  NPM_PASSWORD: 'suchsecure',
};
const cli = require.resolve('../bin/semantic-release');
const pluginError = require.resolve('./fixtures/plugin-error');
const pluginInheritedError = require.resolve('./fixtures/plugin-error-inherited');

test.before(async () => {
  // Start Mock Server
  await mockServer.start();
  // Start the local NPM registry
  await registry.start();
});

test.beforeEach(t => {
  // Save the current process.env
  t.context.env = Object.assign({}, process.env);
  // Save the current working diretory
  t.context.cwd = process.cwd();

  t.context.log = stub(console, 'log');
  t.context.error = stub(console, 'error');
  t.context.stdout = stub(process.stdout, 'write');
  t.context.stderr = stub(process.stderr, 'write');
});

test.afterEach.always(t => {
  // Restore process.env
  process.env = Object.assign({}, t.context.env);
  // Restore the current working directory
  process.chdir(t.context.cwd);

  t.context.log.restore();
  t.context.error.restore();
  t.context.stdout.restore();
  t.context.stderr.restore();
});

test.after.always(async () => {
  await mockServer.stop();
  // Stop the local NPM registry
  await registry.stop();
});

test.serial('Release patch, minor and major versions', async t => {
  const packageName = 'test-release';
  const owner = 'test-owner';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository and package.json');
  await gitRepo();
  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: `git+https://github.com/${owner}/${packageName}`},
    release: {verifyConditions: ['@semantic-release/github', '@semantic-release/npm']},
    publishConfig: {registry: registry.uri},
  });
  // Create a npm-shrinkwrap.json file
  await execa('npm', ['shrinkwrap'], {env});

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
  let createRefMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/git/refs`,
    {body: {ref: `refs/tags/v${version}`}, headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {ref: `refs/tags/${version}`}}
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
  t.regex(stdout, new RegExp(`Published Github release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, version);
  t.is((await readJson('./npm-shrinkwrap.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  let [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env})).stdout
  );
  t.is(releasedVersion, version);
  t.is(releasedGitHead, await gitHead());
  t.log(`+ released ${releasedVersion} with gitHead ${releasedGitHead}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createRefMock);
  await mockServer.verify(createReleaseMock);

  /* Patch release */
  version = '1.0.1';
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  createRefMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/git/refs`,
    {body: {ref: `refs/tags/v${version}`}, headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {ref: `refs/tags/${version}`}}
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
  t.regex(stdout, new RegExp(`Published Github release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, version);
  t.is((await readJson('./npm-shrinkwrap.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env})).stdout
  );
  t.is(releasedVersion, version);
  t.is(releasedGitHead, await gitHead());
  t.log(`+ released ${releasedVersion} with gitHead ${releasedGitHead}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createRefMock);
  await mockServer.verify(createReleaseMock);

  /* Minor release */
  version = '1.1.0';
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  createRefMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/git/refs`,
    {body: {ref: `refs/tags/v${version}`}, headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {ref: `refs/tags/${version}`}}
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
  t.regex(stdout, new RegExp(`Published Github release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, version);
  t.is((await readJson('./npm-shrinkwrap.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env})).stdout
  );
  t.is(releasedVersion, version);
  t.is(releasedGitHead, await gitHead());
  t.log(`+ released ${releasedVersion} with gitHead ${releasedGitHead}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createRefMock);
  await mockServer.verify(createReleaseMock);

  /* Major release */
  version = '2.0.0';
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  createRefMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/git/refs`,
    {body: {ref: `refs/tags/v${version}`}, headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {ref: `refs/tags/${version}`}}
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
  t.regex(stdout, new RegExp(`Published Github release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, version);
  t.is((await readJson('./npm-shrinkwrap.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env})).stdout
  );
  t.is(releasedVersion, version);
  t.is(releasedGitHead, await gitHead());
  t.log(`+ released ${releasedVersion} with gitHead ${releasedGitHead}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createRefMock);
  await mockServer.verify(createReleaseMock);
});

test.serial('Release versions from a packed git repository, using tags to determine last release gitHead', async t => {
  const packageName = 'test-git-packaed';
  const owner = 'test-repo';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository');
  await gitRepo();

  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: `git@github.com:${owner}/${packageName}.git`},
    release: {verifyConditions: ['@semantic-release/github', '@semantic-release/npm']},
    publishConfig: {registry: registry.uri},
  });

  /* Initial release */
  let version = '1.0.0';
  let verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  let createRefMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/git/refs`,
    {body: {ref: `refs/tags/v${version}`}, headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {ref: `refs/tags/${version}`}}
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
  t.log('$ git pack-refs --all');
  await gitPackRefs();
  t.log('$ semantic-release');
  let {stdout, code} = await execa(cli, [], {env});
  t.regex(stdout, new RegExp(`Published Github release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);
  // Verify package.json has been updated
  t.is((await readJson('./package.json')).version, version);
  // Retrieve the published package from the registry and check version
  let releasedVersion = (await execa('npm', ['show', packageName, 'version'], {env})).stdout;
  t.is(releasedVersion, version);
  t.log(`+ released ${releasedVersion}`);
  await mockServer.verify(verifyMock);
  await mockServer.verify(createRefMock);
  await mockServer.verify(createReleaseMock);
  // Create a tag version so the tag can be used later to determine the commit associated with the version
  await gitTagVersion(`v${version}`);
  t.log(`Create git tag v${version}`);

  /* Patch release */
  version = '1.0.1';
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  createRefMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/git/refs`,
    {body: {ref: `refs/tags/v${version}`}, headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {ref: `refs/tags/${version}`}}
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
  t.regex(stdout, new RegExp(`Published Github release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);
  // Verify package.json has been updated
  t.is((await readJson('./package.json')).version, version);

  // Retrieve the published package from the registry and check version
  releasedVersion = (await execa('npm', ['show', packageName, 'version'], {env})).stdout;
  t.is(releasedVersion, version);
  t.log(`+ released ${releasedVersion}`);
  await mockServer.verify(verifyMock);
  await mockServer.verify(createRefMock);
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
    release: {analyzeCommits: 'non-existing-path'},
  });

  const {code, stderr} = await t.throws(execa(cli, [], {env}));
  t.is(code, 1);
  t.regex(stderr, /Cannot find module/);
});

test.serial('Create a tag as a recovery solution for "ENOTINHISTORY" error', async t => {
  const packageName = 'test-recovery';
  const owner = 'test-repo';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository');
  await gitRepo();

  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: `git+https://github.com/${owner}/${packageName}`},
    release: {verifyConditions: ['@semantic-release/github', '@semantic-release/npm']},
    publishConfig: {registry: registry.uri},
  });

  /* Initial release */
  let version = '1.0.0';
  let verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  let createRefMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/git/refs`,
    {body: {ref: `refs/tags/v${version}`}, headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {ref: `refs/tags/${version}`}}
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
  let {stderr, stdout, code} = await execa(cli, [], {env});
  t.regex(stdout, new RegExp(`Published Github release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);
  // Verify package.json has been updated
  t.is((await readJson('./package.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  let [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env})).stdout
  );
  const head = await gitHead();
  t.is(releasedGitHead, head);
  t.is(releasedVersion, version);
  t.log(`+ released ${releasedVersion}`);
  await mockServer.verify(verifyMock);
  await mockServer.verify(createRefMock);
  await mockServer.verify(createReleaseMock);

  // Create a tag version so the tag can be used later to determine the commit associated with the version
  await gitTagVersion(`v${version}`);
  t.log(`Create git tag v${version}`);

  /* Rewrite sha of commit used for release */

  t.log('Amend release commit');
  const {hash} = await gitAmmendCommit('feat: Initial commit');

  /* Patch release */
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  t.log('Commit a fix');
  await gitCommits(['fix: bar']);
  t.log('$ semantic-release');
  ({stderr, stdout, code} = await execa(cli, [], {env, reject: false}));

  t.log('Log "ENOTINHISTORY" message');
  t.is(code, 0);
  t.regex(
    stderr,
    new RegExp(
      `You can recover from this error by restoring the commit "${head}" or by creating a tag for the version "${
        version
      }" on the commit corresponding to this release`
    )
  );

  /* Create a tag to recover and redo release */

  t.log(`Create git tag v${version} to recover`);
  await gitTagVersion(`v${version}`, hash);

  version = '1.0.1';
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  createRefMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/git/refs`,
    {body: {ref: `refs/tags/v${version}`}, headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}]},
    {body: {ref: `refs/tags/${version}`}}
  );
  createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: {tag_name: `v${version}`, target_commitish: 'master', name: `v${version}`},
      headers: [{name: 'Authorization', values: [`token ${env.GH_TOKEN}`]}],
    },
    {body: {html_url: `release-url/${version}`}}
  );

  t.log('$ semantic-release');
  ({stderr, stdout, code} = await execa(cli, [], {env}));
  t.regex(stdout, new RegExp(`Published Github release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);
  // Verify package.json has been updated
  t.is((await readJson('./package.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  releasedVersion = (await execa('npm', ['show', packageName, 'version'], {env})).stdout;
  t.is(releasedVersion, version);
  t.log(`+ released ${releasedVersion}`);
  await mockServer.verify(verifyMock);
  await mockServer.verify(createRefMock);
  await mockServer.verify(createReleaseMock);
});

test.serial('Dry-run', async t => {
  const packageName = 'test-dry-run';
  const owner = 'test-repo';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository and package.json');
  await gitRepo();
  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: `git+https://github.com/${owner}/${packageName}`},
    publishConfig: {registry: registry.uri},
  });

  /* Initial release */
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
});

test.serial('Pass options via CLI arguments', async t => {
  const packageName = 'test-cli';
  const owner = 'test-repo';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository and package.json');
  await gitRepo();
  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: `git+https://github.com/${owner}/${packageName}`},
    publishConfig: {registry: registry.uri},
  });

  /* Initial release */
  const version = '1.0.0';
  t.log('Commit a feature');
  await gitCommits(['feat: Initial commit']);
  t.log('$ semantic-release');
  const {stdout, code} = await execa(
    cli,
    ['--verify-conditions', '@semantic-release/npm', '--publish', '@semantic-release/npm', '--debug'],
    {env}
  );
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(code, 0);

  // Verify package.json and has been updated
  t.is((await readJson('./package.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  const [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env})).stdout
  );
  t.is(releasedVersion, version);
  t.is(releasedGitHead, await gitHead());
  t.log(`+ released ${releasedVersion} with gitHead ${releasedGitHead}`);
});

test.serial('Run via JS API', async t => {
  const packageName = 'test-js-api';
  const owner = 'test-repo';
  const githubToken = 'OTHER_TOKEN';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository and package.json');
  await gitRepo();
  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: `git+https://github.com/${owner}/${packageName}`},
    publishConfig: {registry: registry.uri},
  });

  /* Initial release */
  const version = '1.0.0';
  const verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    {headers: [{name: 'Authorization', values: [`token ${githubToken}`]}]},
    {body: {permissions: {push: true}}, method: 'GET'}
  );
  const createRefMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/git/refs`,
    {body: {ref: `refs/tags/v${version}`}, headers: [{name: 'Authorization', values: [`token ${githubToken}`]}]},
    {body: {ref: `refs/tags/${version}`}}
  );
  const createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: {tag_name: `v${version}`, target_commitish: 'master', name: `v${version}`},
      headers: [{name: 'Authorization', values: [`token ${githubToken}`]}],
    },
    {body: {html_url: `release-url/${version}`}}
  );

  process.env = Object.assign(process.env, env);

  t.log('Commit a feature');
  await gitCommits(['feat: Initial commit']);
  t.log('$ Call semantic-release via API');
  await semanticRelease({
    verifyConditions: [{path: '@semantic-release/github', githubToken}, '@semantic-release/npm'],
    publish: [{path: '@semantic-release/github', githubToken}, '@semantic-release/npm'],
    debug: true,
  });

  t.true(t.context.log.calledWithMatch(/Published Github release: /, new RegExp(`release-url/${version}`)));
  t.true(t.context.log.calledWithMatch(/Publishing version .* to npm registry/, version));

  // Verify package.json and has been updated
  t.is((await readJson('./package.json')).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  const [, releasedVersion, releasedGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', packageName, 'version', 'gitHead'], {env})).stdout
  );
  t.is(releasedVersion, version);
  t.is(releasedGitHead, await gitHead());
  t.log(`+ released ${releasedVersion} with gitHead ${releasedGitHead}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createRefMock);
  await mockServer.verify(createReleaseMock);
});

test.serial('Log unexpected errors from plugins and exit with 1', async t => {
  const packageName = 'test-unexpected-error';
  const owner = 'test-repo';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository and package.json');
  await gitRepo();
  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: `git+https://github.com/${owner}/${packageName}`},
    release: {verifyConditions: pluginError},
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

test.serial('Log errors inheriting SemanticReleaseError and exit with 0', async t => {
  const packageName = 'test-inherited-error';
  const owner = 'test-repo';
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository and package.json');
  await gitRepo();
  // Create package.json in repository root
  await writeJson('./package.json', {
    name: packageName,
    version: '0.0.0-dev',
    repository: {url: `git+https://github.com/${owner}/${packageName}`},
    release: {verifyConditions: pluginInheritedError},
  });

  /* Initial release */
  t.log('Commit a feature');
  await gitCommits(['feat: Initial commit']);
  t.log('$ semantic-release');
  const {stdout, code} = await execa(cli, [], {env, reject: false});
  // Verify the type and message are logged
  t.regex(stdout, /EINHERITED Inherited error/);
  t.is(code, 0);
});

test.serial('CLI returns error code and prints help if called with a command', async t => {
  t.log('$ semantic-release pre');
  const {stdout, code} = await execa(cli, ['pre'], {env, reject: false});
  t.regex(stdout, /Usage: semantic-release/);
  t.is(code, 1);
});

test.serial('CLI prints help if called with --help', async t => {
  t.log('$ semantic-release --help');
  const {stdout, code} = await execa(cli, ['--help'], {env});
  t.regex(stdout, /Usage: semantic-release/);
  t.is(code, 0);
});

test.serial('CLI returns error code with invalid option', async t => {
  t.log('$ semantic-release --unknown-option');
  const {stderr, code} = await execa(cli, ['--unknown-option'], {env, reject: false});
  t.regex(stderr, /unknown option/);
  t.is(code, 1);
});

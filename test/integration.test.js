import test from 'ava';
import {writeJson, readJson} from 'fs-extra';
import {start, stop, uri} from './helpers/registry';
import {gitRepo, gitCommits, gitHead, gitTagVersion, gitPackRefs} from './helpers/git-utils';
import execa from 'execa';

test.before(async t => {
  // Start the local NPM registry
  await start();
});

test.beforeEach(async t => {
  // Save the current working diretory
  t.context.cwd = process.cwd();
});

test.afterEach.always(async t => {
  // Restore the current working directory
  process.chdir(t.context.cwd);
});

test.after.always(async t => {
  // Stop the local NPM registry
  await stop();
});

test.serial('Release patch, minor and major versions', async t => {
  // Environment variables used with cli
  const env = {
    CI: true,
    npm_config_registry: uri,
    GH_TOKEN: 'github_token',
    NPM_OLD_TOKEN: 'aW50ZWdyYXRpb246c3VjaHNlY3VyZQ==',
    NPM_EMAIL: 'integration@test.com',
  };
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository');
  await gitRepo();

  // Create package.json in repository root
  await writeJson('./package.json', {
    name: 'test-module',
    version: '0.0.0-dev',
    repository: {url: 'git+https://github.com/semantic-release/test-module'},
    release: {verifyConditions: require.resolve('../src/lib/plugin-noop')},
  });
  // Create a npm-shrinkwrap.json file
  await execa('npm', ['shrinkwrap'], {env});

  /** No release **/

  t.log('Commit a chore');
  await gitCommits(['chore: Init repository']);
  t.log('$ semantic-release pre');
  let {stdout, stderr, code} = await t.throws(execa(require.resolve('../bin/semantic-release'), ['pre'], {env}));
  t.regex(stderr, /ENOCHANGE There are no relevant changes, so no new version is released/);
  t.is(code, 1);

  /** Minor release **/

  t.log('Commit a feature');
  await gitCommits(['feat: Initial commit']);
  t.log('$ semantic-release pre');
  ({stdout, stderr, code} = await execa(require.resolve('../bin/semantic-release'), ['pre'], {env}));
  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, '1.0.0');
  t.is((await readJson('./npm-shrinkwrap.json')).version, '1.0.0');
  t.log('$ npm publish');
  ({stdout, stderr, code} = await execa('npm', ['publish'], {env}));
  // Verify output of npm publish
  t.regex(stdout, /test-module@1.0.0/);
  t.is(code, 0);
  // Retrieve the published package from the registry and check version and gitHead
  let [, version, releaseGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', 'test-module', 'version', 'gitHead'], {env})).stdout
  );
  t.is(version, '1.0.0');
  t.is(releaseGitHead, await gitHead());
  t.log(`+ released ${version} with gitHead ${releaseGitHead}`);

  /** Patch release **/

  t.log('Commit a fix');
  await gitCommits(['fix: bar']);
  t.log('$ semantic-release pre');
  ({stdout, stderr, code} = await execa(require.resolve('../bin/semantic-release'), ['pre'], {env}));
  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, '1.0.1');
  t.is((await readJson('./npm-shrinkwrap.json')).version, '1.0.1');
  t.log('$ npm publish');
  ({stdout, stderr, code} = await execa('npm', ['publish'], {env}));
  // Verify output of npm publish
  t.regex(stdout, /test-module@1.0.1/);
  t.is(code, 0);
  // Retrieve the published package from the registry and check version and gitHead
  [, version, releaseGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', 'test-module', 'version', 'gitHead'], {env})).stdout
  );
  t.is(version, '1.0.1');
  t.is(releaseGitHead, await gitHead());
  t.log(`+ released ${version} with gitHead ${releaseGitHead}`);

  /** Minor release **/

  t.log('Commit a feature');
  await gitCommits(['feat: baz']);
  t.log('$ semantic-release pre');
  ({stdout, stderr, code} = await execa(require.resolve('../bin/semantic-release'), ['pre'], {env}));
  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, '1.1.0');
  t.is((await readJson('./npm-shrinkwrap.json')).version, '1.1.0');
  t.log('$ npm publish');
  ({stdout, stderr, code} = await execa('npm', ['publish'], {env}));
  // Verify output of npm publish
  t.regex(stdout, /test-module@1.1.0/);
  t.is(code, 0);
  // Retrieve the published package from the registry and check version and gitHead
  [, version, releaseGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', 'test-module', 'version', 'gitHead'], {env})).stdout
  );
  t.is(version, '1.1.0');
  t.is(releaseGitHead, await gitHead());
  t.log(`+ released ${version} with gitHead ${releaseGitHead}`);

  /** Major release **/

  t.log('Commit a breaking change');
  await gitCommits(['feat: foo\n\n BREAKING CHANGE: bar']);
  t.log('$ semantic-release pre');
  ({stdout, stderr, code} = await execa(require.resolve('../bin/semantic-release'), ['pre'], {env}));
  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson('./package.json')).version, '2.0.0');
  t.is((await readJson('./npm-shrinkwrap.json')).version, '2.0.0');
  t.log('$ npm publish');
  ({stdout, stderr, code} = await execa('npm', ['publish'], {env}));
  // Verify output of npm publish
  t.regex(stdout, /test-module@2.0.0/);
  t.is(code, 0);
  // Retrieve the published package from the registry and check version and gitHead
  [, version, releaseGitHead] = /^version = '(.+)'\s+gitHead = '(.+)'$/.exec(
    (await execa('npm', ['show', 'test-module', 'version', 'gitHead'], {env})).stdout
  );
  t.is(version, '2.0.0');
  t.is(releaseGitHead, await gitHead());
  t.log(`+ released ${version} with gitHead ${releaseGitHead}`);
});

test.serial('Release versions from a packed git repository, using tags to determine last release gitHead', async t => {
  // Environment variables used with cli
  const env = {
    CI: true,
    npm_config_registry: uri,
    GH_TOKEN: 'github_token',
    NPM_OLD_TOKEN: 'aW50ZWdyYXRpb246c3VjaHNlY3VyZQ==',
    NPM_EMAIL: 'integration@test.com',
  };
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository');
  await gitRepo();

  // Create package.json in repository root
  await writeJson('./package.json', {
    name: 'test-module-2',
    version: '0.0.0-dev',
    repository: {url: 'git+https://github.com/semantic-release/test-module-2'},
    release: {verifyConditions: require.resolve('../src/lib/plugin-noop')},
  });

  /** Minor release **/

  t.log('Commit a feature');
  await gitCommits(['feat: Initial commit']);
  t.log('$ git pack-refs --all');
  await gitPackRefs();
  t.log('$ semantic-release pre');
  let {stdout, code} = await execa(require.resolve('../bin/semantic-release'), ['pre'], {env});
  // Verify package.json has been updated
  t.is((await readJson('./package.json')).version, '1.0.0');
  t.log('$ npm publish');
  ({stdout, code} = await execa('npm', ['publish'], {env}));
  // Verify output of npm publish
  t.regex(stdout, /test-module-2@1.0.0/);
  t.is(code, 0);
  // Retrieve the published package from the registry and check version and gitHead
  let version = (await execa('npm', ['show', 'test-module-2', 'version'], {env})).stdout;
  t.is(version, '1.0.0');
  t.log(`+ released ${version}`);
  // Create a tag version so the tag can be used later to determine the commit associated with the version
  await gitTagVersion('v1.0.0');
  t.log('Create git tag v1.0.0');

  /** Patch release **/

  t.log('Commit a fix');
  await gitCommits(['fix: bar']);
  t.log('$ semantic-release pre');
  ({stdout, code} = await execa(require.resolve('../bin/semantic-release'), ['pre'], {env}));
  // Verify package.json has been updated
  t.is((await readJson('./package.json')).version, '1.0.1');
  t.log('$ npm publish');
  ({stdout, code} = await execa('npm', ['publish'], {env}));
  // Verify output of npm publish
  t.regex(stdout, /test-module-2@1.0.1/);
  t.is(code, 0);
  // Retrieve the published package from the registry and check version and gitHead
  version = (await execa('npm', ['show', 'test-module-2', 'version'], {env})).stdout;
  t.is(version, '1.0.1');
  t.log(`+ released ${version}`);
});

test.serial('Exit with 1 in a plugin is not found', async t => {
  // Environment variables used with cli
  const env = {
    CI: true,
    npm_config_registry: uri,
    GH_TOKEN: 'github_token',
    NPM_OLD_TOKEN: 'aW50ZWdyYXRpb246c3VjaHNlY3VyZQ==',
    NPM_EMAIL: 'integration@test.com',
  };
  // Create a git repository, set the current working directory at the root of the repo
  t.log('Create git repository');
  await gitRepo();
  await writeJson('./package.json', {
    name: 'test-module-3',
    version: '0.0.0-dev',
    repository: {url: 'git+https://github.com/semantic-release/test-module-4'},
    release: {analyzeCommits: 'non-existing-path'},
  });

  const {code} = await t.throws(execa(require.resolve('../bin/semantic-release'), ['pre'], {env}));
  t.is(code, 1);
});

import test from 'ava';
import {stub} from 'sinon';
import getLastRelease from '../lib/get-last-release';
import {gitRepo, gitCommits, gitTagVersion, gitCheckout} from './helpers/git-utils';

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Get the highest non-prerelease valid tag', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Create some commits and tags
  await gitCommits(['First'], {cwd});
  await gitTagVersion('foo', undefined, {cwd});
  const commits = await gitCommits(['Second'], {cwd});
  await gitTagVersion('v2.0.0', undefined, {cwd});
  await gitCommits(['Third'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitCommits(['Fourth'], {cwd});
  await gitTagVersion('v3.0', undefined, {cwd});
  await gitCommits(['Fifth'], {cwd});
  await gitTagVersion('v3.0.0-beta.1', undefined, {cwd});

  const result = await getLastRelease({cwd, options: {tagFormat: `v\${version}`}, logger: t.context.logger});

  t.deepEqual(result, {gitHead: commits[0].hash, gitTag: 'v2.0.0', version: '2.0.0'});
  t.deepEqual(t.context.log.args[0], ['Found git tag %s associated with version %s', 'v2.0.0', '2.0.0']);
});

test('Get the highest tag in the history of the current branch', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commit to the master branch
  await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  // Create the new branch 'other-branch' from master
  await gitCheckout('other-branch', true, {cwd});
  // Add commit to the 'other-branch' branch
  await gitCommits(['Second'], {cwd});
  // Create the tag corresponding to version 3.0.0
  await gitTagVersion('v3.0.0', undefined, {cwd});
  // Checkout master
  await gitCheckout('master', false, {cwd});
  // Add another commit to the master branch
  const commits = await gitCommits(['Third'], {cwd});
  // Create the tag corresponding to version 2.0.0
  await gitTagVersion('v2.0.0', undefined, {cwd});

  const result = await getLastRelease({cwd, options: {tagFormat: `v\${version}`}, logger: t.context.logger});

  t.deepEqual(result, {gitHead: commits[0].hash, gitTag: 'v2.0.0', version: '2.0.0'});
});

test('Match the tag name from the begining of the string', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const commits = await gitCommits(['First'], {cwd});
  await gitTagVersion('prefix/v1.0.0', undefined, {cwd});
  await gitTagVersion('prefix/v2.0.0', undefined, {cwd});
  await gitTagVersion('other-prefix/v3.0.0', undefined, {cwd});

  const result = await getLastRelease({cwd, options: {tagFormat: `prefix/v\${version}`}, logger: t.context.logger});

  t.deepEqual(result, {gitHead: commits[0].hash, gitTag: 'prefix/v2.0.0', version: '2.0.0'});
});

test('Return empty object if no valid tag is found', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Create some commits and tags
  await gitCommits(['First'], {cwd});
  await gitTagVersion('foo', undefined, {cwd});
  await gitCommits(['Second'], {cwd});
  await gitTagVersion('v2.0.x', undefined, {cwd});
  await gitCommits(['Third'], {cwd});
  await gitTagVersion('v3.0', undefined, {cwd});

  const result = await getLastRelease({cwd, options: {tagFormat: `v\${version}`}, logger: t.context.logger});

  t.deepEqual(result, {});
  t.is(t.context.log.args[0][0], 'No git tag version found');
});

test('Return empty object if no valid tag is found in history', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  await gitCommits(['First'], {cwd});
  await gitCheckout('other-branch', true, {cwd});
  await gitCommits(['Second'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitTagVersion('v2.0.0', undefined, {cwd});
  await gitTagVersion('v3.0.0', undefined, {cwd});
  await gitCheckout('master', false, {cwd});

  const result = await getLastRelease({cwd, options: {tagFormat: `v\${version}`}, logger: t.context.logger});

  t.deepEqual(result, {});
  t.is(t.context.log.args[0][0], 'No git tag version found');
});

test('Get the highest valid tag corresponding to the "tagFormat"', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Create some commits and tags
  const [{hash: gitHead}] = await gitCommits(['First'], {cwd});

  await gitTagVersion('1.0.0', undefined, {cwd});
  t.deepEqual(await getLastRelease({cwd, options: {tagFormat: `\${version}`}, logger: t.context.logger}), {
    gitHead,
    gitTag: '1.0.0',
    version: '1.0.0',
  });

  await gitTagVersion('foo-1.0.0-bar', undefined, {cwd});
  t.deepEqual(await getLastRelease({cwd, options: {tagFormat: `foo-\${version}-bar`}, logger: t.context.logger}), {
    gitHead,
    gitTag: 'foo-1.0.0-bar',
    version: '1.0.0',
  });

  await gitTagVersion('foo-v1.0.0-bar', undefined, {cwd});
  t.deepEqual(await getLastRelease({cwd, options: {tagFormat: `foo-v\${version}-bar`}, logger: t.context.logger}), {
    gitHead,
    gitTag: 'foo-v1.0.0-bar',
    version: '1.0.0',
  });

  await gitTagVersion('(.+)/1.0.0/(a-z)', undefined, {cwd});
  t.deepEqual(await getLastRelease({cwd, options: {tagFormat: `(.+)/\${version}/(a-z)`}, logger: t.context.logger}), {
    gitHead,
    gitTag: '(.+)/1.0.0/(a-z)',
    version: '1.0.0',
  });

  await gitTagVersion('2.0.0-1.0.0-bar.1', undefined, {cwd});
  t.deepEqual(await getLastRelease({cwd, options: {tagFormat: `2.0.0-\${version}-bar.1`}, logger: t.context.logger}), {
    gitHead,
    gitTag: '2.0.0-1.0.0-bar.1',
    version: '1.0.0',
  });

  await gitTagVersion('3.0.0-bar.1', undefined, {cwd});
  t.deepEqual(await getLastRelease({cwd, options: {tagFormat: `\${version}-bar.1`}, logger: t.context.logger}), {
    gitHead,
    gitTag: '3.0.0-bar.1',
    version: '3.0.0',
  });
});

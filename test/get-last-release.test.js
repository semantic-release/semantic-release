import test from 'ava';
import {stub} from 'sinon';
import getLastRelease from '../lib/get-last-release';
import {gitRepo, gitCommits, gitTagVersion, gitCheckout} from './helpers/git-utils';

// Save the current working diretory
const cwd = process.cwd();

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test.afterEach.always(() => {
  // Restore the current working directory
  process.chdir(cwd);
});

test.serial('Get the highest valid tag', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Create some commits and tags
  await gitCommits(['First']);
  await gitTagVersion('foo');
  const commits = await gitCommits(['Second']);
  await gitTagVersion('v2.0.0');
  await gitCommits(['Third']);
  await gitTagVersion('v1.0.0');
  await gitCommits(['Fourth']);
  await gitTagVersion('v3.0');

  const result = await getLastRelease(t.context.logger);

  t.deepEqual(result, {gitHead: commits[0].hash, gitTag: 'v2.0.0', version: '2.0.0'});
  t.deepEqual(t.context.log.args[0], ['Found git tag version %s', 'v2.0.0']);
});

test.serial('Get the highest tag in the history of the current branch', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commit to the master branch
  await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  // Create the new branch 'other-branch' from master
  await gitCheckout('other-branch');
  // Add commit to the 'other-branch' branch
  await gitCommits(['Second']);
  // Create the tag corresponding to version 3.0.0
  await gitTagVersion('v3.0.0');
  // Checkout master
  await gitCheckout('master', false);
  // Add another commit to the master branch
  const commits = await gitCommits(['Third']);
  // Create the tag corresponding to version 2.0.0
  await gitTagVersion('v2.0.0');

  const result = await getLastRelease(t.context.logger);

  t.deepEqual(result, {gitHead: commits[0].hash, gitTag: 'v2.0.0', version: '2.0.0'});
});

test.serial('Return empty object if no valid tag is found', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Create some commits and tags
  await gitCommits(['First']);
  await gitTagVersion('foo');
  await gitCommits(['Second']);
  await gitTagVersion('v2.0.x');
  await gitCommits(['Third']);
  await gitTagVersion('v3.0');

  const result = await getLastRelease(t.context.logger);

  t.deepEqual(result, {});
  t.is(t.context.log.args[0][0], 'No git tag version found');
});

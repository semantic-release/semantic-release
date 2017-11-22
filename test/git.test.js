import test from 'ava';
import {gitTagHead, gitCommitTag, isCommitInHistory, unshallow, gitHead} from '../lib/git';
import {gitRepo, gitCommits, gitCheckout, gitTagVersion, gitShallowClone, gitLog} from './helpers/git-utils';

test.beforeEach(t => {
  // Save the current working diretory
  t.context.cwd = process.cwd();
});

test.afterEach.always(t => {
  // Restore the current working directory
  process.chdir(t.context.cwd);
});

test.serial('Get the last commit sha', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First']);

  const result = await gitHead();

  t.is(result.substring(0, 7), commits[0].hash);
});

test.serial('Throw error if the last commit sha cannot be found', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();

  await t.throws(gitHead());
});

test.serial('Unshallow repository', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repo = await gitRepo();
  // Add commits to the master branch
  await gitCommits(['First', 'Second']);
  // Create a shallow clone with only 1 commit
  await gitShallowClone(repo);

  // Verify the shallow clone contains only one commit
  t.is((await gitLog()).length, 1);

  await unshallow();

  // Verify the shallow clone contains all the commits
  t.is((await gitLog()).length, 2);
});

test.serial('Do not throw error when unshallow a complete repository', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  await gitCommits(['First']);
  await t.notThrows(unshallow());
});

test.serial('Verify if the commit `sha` is in the direct history of the current branch', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First']);
  // Create the new branch 'other-branch' from master
  await gitCheckout('other-branch');
  // Add commits to the 'other-branch' branch
  const otherCommits = await gitCommits(['Second']);
  await gitCheckout('master', false);

  t.true(await isCommitInHistory(commits[0].hash));
  t.false(await isCommitInHistory(otherCommits[0].hash));
});

test.serial('Get the tag associated with a commit sha or "null" if the commit does not exists', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');

  t.is(await gitCommitTag(commits[0].hash), 'v1.0.0');
  t.falsy(await gitCommitTag('missing_sha'));
});

test.serial('Get the commit sha for a given tag or "null" if the tag does not exists', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');

  t.is((await gitTagHead('v1.0.0')).substring(0, 7), commits[0].hash);
  t.falsy(await gitTagHead('missing_tag'));
});

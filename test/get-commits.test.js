import test from 'ava';
import {gitRepo, gitCommits, gitCheckout} from './helpers/git-utils';
import proxyquire from 'proxyquire';
import {stub} from 'sinon';
import SemanticReleaseError from '@semantic-release/error';

// Stub to capture the log messages
const errorLog = stub();
// Module to test
const getCommits = proxyquire('../src/lib/get-commits', {npmlog: {error: errorLog}});

test.beforeEach(t => {
  // Save the current working diretory
  t.context.cwd = process.cwd();
  // Reset the stub call history
  errorLog.resetHistory();
});

test.afterEach.always(t => {
  // Restore the current working directory
  process.chdir(t.context.cwd);
});

test.serial('Get all commits when there is no last release', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['fix: First fix', 'feat: Second feature']);

  // Retrieve the commits with the commits module
  const result = await getCommits({lastRelease: {}, options: {branch: 'master'}});

  // The commits created and and retrieved by the module are identical
  t.is(result.length, 2);
  t.is(result[0].hash.substring(0, 7), commits[0].hash);
  t.is(result[0].message, commits[0].message);
  t.is(result[1].hash.substring(0, 7), commits[1].hash);
  t.is(result[1].message, commits[1].message);
});

test.serial('Get all commits since lastRelease gitHead', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['fix: First fix', 'feat: Second feature', 'feat: Third feature']);

  // Retrieve the commits with the commits module
  const result = await getCommits({
    lastRelease: {gitHead: commits[commits.length - 1].hash},
    options: {branch: 'master'},
  });
  // The commits created and retrieved by the module are identical
  t.is(result.length, 2);
  t.is(result[0].hash.substring(0, 7), commits[0].hash);
  t.is(result[0].message, commits[0].message);
  t.is(result[1].hash.substring(0, 7), commits[1].hash);
  t.is(result[1].message, commits[1].message);
});

test.serial('Return empty array if there is no commits', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['fix: First fix', 'feat: Second feature']);

  // Retrieve the commits with the commits module
  const result = await getCommits({lastRelease: {gitHead: commits[0].hash}, options: {branch: 'master'}});

  // Verify no commit is retrieved
  t.deepEqual(result, []);
});

test.serial('Return empty array if lastRelease.gitHead is the last commit', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();

  // Retrieve the commits with the commits module
  const result = await getCommits({lastRelease: {}, options: {branch: 'master'}});

  // Verify no commit is retrieved
  t.deepEqual(result, []);
});

test.serial('Throws ENOTINHISTORY error if gitHead is not in history', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  await gitCommits(['fix: First fix', 'feat: Second feature']);

  // Retrieve the commits with the commits module
  const error = await t.throws(getCommits({lastRelease: {gitHead: 'notinhistory'}, options: {branch: 'master'}}));

  // Verify error code and message
  t.is(error.code, 'ENOTINHISTORY');
  t.true(error instanceof SemanticReleaseError);

  // Verify the log function has been called with a message mentionning the branch
  t.regex(errorLog.firstCall.args[1], /history of the "master" branch/);
  // Verify the log function has been called with a message mentionning the missing gitHead
  t.regex(errorLog.firstCall.args[1], /restoring the commit "notinhistory"/);
});

test.serial('Throws ENOTINHISTORY error if gitHead is not in branch history but present in others', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  await gitCommits(['First', 'Second']);
  // Create the new branch 'other-branch' from master
  await gitCheckout('other-branch', true);
  // Add commits to the 'other-branch' branch
  const commitsBranch = await gitCommits(['Third', 'Fourth']);
  // Create the new branch 'another-branch' from 'other-branch'
  await gitCheckout('another-branch', true);

  // Retrieve the commits with the commits module
  const error = await t.throws(
    getCommits({lastRelease: {version: '1.0.1', gitHead: commitsBranch[0].hash}, options: {branch: 'master'}})
  );

  // Verify error code and message
  t.is(error.code, 'ENOTINHISTORY');
  t.true(error instanceof SemanticReleaseError);

  // Verify the log function has been called with a message mentionning the branch
  t.regex(errorLog.firstCall.args[1], /history of the "master" branch/);
  // Verify the log function has been called with a message mentionning the missing gitHead
  t.regex(errorLog.firstCall.args[1], new RegExp(`restoring the commit "${commitsBranch[0].hash}"`));
  // Verify the log function has been called with a message mentionning the branches that contains the gitHead
  t.regex(errorLog.firstCall.args[1], /\* another-branch\s+\* other-branch/);
});

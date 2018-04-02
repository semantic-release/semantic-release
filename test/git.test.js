import test from 'ava';
import tempy from 'tempy';
import {
  gitTagHead,
  isRefInHistory,
  unshallow,
  gitHead,
  repoUrl,
  tag,
  push,
  gitTags,
  isGitRepo,
  verifyTagName,
  isBranchUpToDate,
} from '../lib/git';
import {
  gitRepo,
  gitCommits,
  gitCheckout,
  gitTagVersion,
  gitShallowClone,
  gitGetCommits,
  gitAddConfig,
  gitCommitTag,
  gitRemoteTagHead,
  push as pushUtil,
  reset,
} from './helpers/git-utils';

// Save the current working diretory
const cwd = process.cwd();

test.afterEach.always(() => {
  // Restore the current working directory
  process.chdir(cwd);
});

test.serial('Get the last commit sha', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First']);

  const result = await gitHead();

  t.is(result, commits[0].hash);
});

test.serial('Throw error if the last commit sha cannot be found', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();

  await t.throws(gitHead(), Error);
});

test.serial('Unshallow repository', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repo = await gitRepo();
  // Add commits to the master branch
  await gitCommits(['First', 'Second']);
  // Create a shallow clone with only 1 commit
  await gitShallowClone(repo);

  // Verify the shallow clone contains only one commit
  t.is((await gitGetCommits()).length, 1);

  await unshallow(repo);

  // Verify the shallow clone contains all the commits
  t.is((await gitGetCommits()).length, 2);
});

test.serial('Do not throw error when unshallow a complete repository', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repo = await gitRepo();
  // Add commits to the master branch
  await gitCommits(['First']);
  await t.notThrows(unshallow(repo));
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

  t.true(await isRefInHistory(commits[0].hash));
  t.falsy(await isRefInHistory(otherCommits[0].hash));
  await t.throws(isRefInHistory('non-existant-sha'));
});

test.serial('Get the commit sha for a given tag or falsy if the tag does not exists', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');

  t.is(await gitTagHead('v1.0.0'), commits[0].hash);
  t.falsy(await gitTagHead('missing_tag'));
});

test.serial('Return git remote repository url from config', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add remote.origin.url config
  await gitAddConfig('remote.origin.url', 'git@hostname.com:owner/package.git');

  t.is(await repoUrl(), 'git@hostname.com:owner/package.git');
});

test.serial('Return git remote repository url set while cloning', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repo = await gitRepo();
  await gitCommits(['First']);
  // Create a clone
  await gitShallowClone(repo);

  t.is(await repoUrl(), repo);
});

test.serial('Return falsy if git repository url is not set', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();

  t.falsy(await repoUrl());
});

test.serial('Add tag on head commit', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  const commits = await gitCommits(['Test commit']);

  await tag('tag_name');

  await t.is(await gitCommitTag(commits[0].hash), 'tag_name');
});

test.serial('Push tag and commit to remote repository', async t => {
  // Create a git repository with a remote, set the current working directory at the root of the repo
  const repo = await gitRepo(true);
  const commits = await gitCommits(['Test commit']);

  await tag('tag_name');
  await push(repo, 'master');

  t.is(await gitRemoteTagHead(repo, 'tag_name'), commits[0].hash);
});

test.serial('Return "true" if in a Git repository', async t => {
  // Create a git repository with a remote, set the current working directory at the root of the repo
  await gitRepo(true);

  t.true(await isGitRepo());
});

test.serial('Return falsy if not in a Git repository', async t => {
  const dir = tempy.directory();
  process.chdir(dir);

  t.falsy(await isGitRepo());
});

test.serial('Return "true" for valid tag names', async t => {
  t.true(await verifyTagName('1.0.0'));
  t.true(await verifyTagName('v1.0.0'));
  t.true(await verifyTagName('tag_name'));
  t.true(await verifyTagName('tag/name'));
});

test.serial('Return falsy for invalid tag names', async t => {
  t.falsy(await verifyTagName('?1.0.0'));
  t.falsy(await verifyTagName('*1.0.0'));
  t.falsy(await verifyTagName('[1.0.0]'));
  t.falsy(await verifyTagName('1.0.0..'));
});

test.serial('Throws error if obtaining the tags fails', async t => {
  const dir = tempy.directory();
  process.chdir(dir);

  await t.throws(gitTags());
});

test.serial('Return "true" if repository is up to date', async t => {
  await gitRepo(true);
  await gitCommits(['First']);
  await pushUtil();

  t.true(await isBranchUpToDate('master'));
});

test.serial('Return falsy if repository is not up to date', async t => {
  await gitRepo(true);
  await gitCommits(['First']);
  await gitCommits(['Second']);
  await pushUtil();

  t.true(await isBranchUpToDate('master'));

  await reset();

  t.falsy(await isBranchUpToDate('master'));
});

test.serial('Return "true" if local repository is ahead', async t => {
  await gitRepo(true);
  await gitCommits(['First']);
  await pushUtil();
  await gitCommits(['Second']);

  t.true(await isBranchUpToDate('master'));
});

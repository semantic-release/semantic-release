import test from 'ava';
import tempy from 'tempy';
import {
  getTagHead,
  isRefInHistory,
  fetch,
  getGitHead,
  repoUrl,
  tag,
  push,
  getTags,
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
  gitPush,
  gitDetachedHead,
} from './helpers/git-utils';

test('Get the last commit sha', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First'], {cwd});

  const result = await getGitHead({cwd});

  t.is(result, commits[0].hash);
});

test('Throw error if the last commit sha cannot be found', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();

  await t.throws(getGitHead({cwd}), Error);
});

test('Unshallow and fetch repository', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  let {cwd, repositoryUrl} = await gitRepo();
  // Add commits to the master branch
  await gitCommits(['First', 'Second'], {cwd});
  // Create a shallow clone with only 1 commit
  cwd = await gitShallowClone(repositoryUrl);

  // Verify the shallow clone contains only one commit
  t.is((await gitGetCommits(undefined, {cwd})).length, 1);

  await fetch(repositoryUrl, {cwd});

  // Verify the shallow clone contains all the commits
  t.is((await gitGetCommits(undefined, {cwd})).length, 2);
});

test('Do not throw error when unshallow a complete repository', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo();
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  await t.notThrows(fetch(repositoryUrl, {cwd}));
});

test('Fetch all tags on a detached head repository', async t => {
  let {cwd, repositoryUrl} = await gitRepo();

  await gitCommits(['First'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitCommits(['Second'], {cwd});
  await gitTagVersion('v1.0.1', undefined, {cwd});
  const [commit] = await gitCommits(['Third'], {cwd});
  await gitTagVersion('v1.1.0', undefined, {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  cwd = await gitDetachedHead(repositoryUrl, commit.hash);

  await fetch(repositoryUrl, {cwd});

  t.deepEqual((await getTags({cwd})).sort(), ['v1.0.0', 'v1.0.1', 'v1.1.0'].sort());
});

test('Verify if the commit `sha` is in the direct history of the current branch', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First'], {cwd});
  // Create the new branch 'other-branch' from master
  await gitCheckout('other-branch', true, {cwd});
  // Add commits to the 'other-branch' branch
  const otherCommits = await gitCommits(['Second'], {cwd});
  await gitCheckout('master', false, {cwd});

  t.true(await isRefInHistory(commits[0].hash, {cwd}));
  t.falsy(await isRefInHistory(otherCommits[0].hash, {cwd}));
  await t.throws(isRefInHistory('non-existant-sha', {cwd}));
});

test('Get the commit sha for a given tag or falsy if the tag does not exists', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});

  t.is(await getTagHead('v1.0.0', {cwd}), commits[0].hash);
  t.falsy(await getTagHead('missing_tag', {cwd}));
});

test('Return git remote repository url from config', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add remote.origin.url config
  await gitAddConfig('remote.origin.url', 'git@hostname.com:owner/package.git', {cwd});

  t.is(await repoUrl({cwd}), 'git@hostname.com:owner/package.git');
});

test('Return git remote repository url set while cloning', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  let {cwd, repositoryUrl} = await gitRepo();
  await gitCommits(['First'], {cwd});
  // Create a clone
  cwd = await gitShallowClone(repositoryUrl);

  t.is(await repoUrl({cwd}), repositoryUrl);
});

test('Return falsy if git repository url is not set', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();

  t.falsy(await repoUrl({cwd}));
});

test('Add tag on head commit', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const commits = await gitCommits(['Test commit'], {cwd});

  await tag('tag_name', {cwd});

  await t.is(await gitCommitTag(commits[0].hash, {cwd}), 'tag_name');
});

test('Push tag to remote repository', async t => {
  // Create a git repository with a remote, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  const commits = await gitCommits(['Test commit'], {cwd});

  await tag('tag_name', {cwd});
  await push(repositoryUrl, 'master', {cwd});

  t.is(await gitRemoteTagHead(repositoryUrl, 'tag_name', {cwd}), commits[0].hash);
});

test('Push tag to remote repository with remote branch ahaed', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  const commits = await gitCommits(['First'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  const tmpRepo = await gitShallowClone(repositoryUrl);
  await gitCommits(['Second'], {cwd: tmpRepo});
  await gitPush('origin', 'master', {cwd: tmpRepo});

  await tag('tag_name', {cwd});
  await push(repositoryUrl, 'master', {cwd});

  t.is(await gitRemoteTagHead(repositoryUrl, 'tag_name', {cwd}), commits[0].hash);
});

test('Return "true" if in a Git repository', async t => {
  // Create a git repository with a remote, set the current working directory at the root of the repo
  const {cwd} = await gitRepo(true);

  t.true(await isGitRepo({cwd}));
});

test('Return falsy if not in a Git repository', async t => {
  const cwd = tempy.directory();

  t.falsy(await isGitRepo({cwd}));
});

test('Return "true" for valid tag names', async t => {
  t.true(await verifyTagName('1.0.0'));
  t.true(await verifyTagName('v1.0.0'));
  t.true(await verifyTagName('tag_name'));
  t.true(await verifyTagName('tag/name'));
});

test('Return falsy for invalid tag names', async t => {
  t.falsy(await verifyTagName('?1.0.0'));
  t.falsy(await verifyTagName('*1.0.0'));
  t.falsy(await verifyTagName('[1.0.0]'));
  t.falsy(await verifyTagName('1.0.0..'));
});

test('Throws error if obtaining the tags fails', async t => {
  const cwd = tempy.directory();

  await t.throws(getTags({cwd}));
});

test('Return "true" if repository is up to date', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['First'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  t.true(await isBranchUpToDate('master', {cwd}));
});

test('Return falsy if repository is not up to date', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['First'], {cwd});
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  t.true(await isBranchUpToDate('master', {cwd}));

  const tmpRepo = await gitShallowClone(repositoryUrl);
  await gitCommits(['Third'], {cwd: tmpRepo});
  await gitPush('origin', 'master', {cwd: tmpRepo});

  t.falsy(await isBranchUpToDate('master', {cwd}));
});

test('Return "true" if local repository is ahead', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['First'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  await gitCommits(['Second'], {cwd});

  t.true(await isBranchUpToDate('master', {cwd}));
});

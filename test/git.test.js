const test = require('ava');
const tempy = require('tempy');
const {
  getTagHead,
  isRefExists,
  fetch,
  getGitHead,
  getGitRemoteHead,
  repoUrl,
  tag,
  push,
  getTags,
  getNoMergeTags,
  getBranches,
  isGitRepo,
  verifyTagName,
  isAncestor,
  getNote,
  addNote,
  fetchNotes,
} = require('../lib/git');
const {
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
  gitDetachedHeadFromBranch,
  gitAddNote,
  gitGetNote,
  gitFetch,
  initGit,
} = require('./helpers/git-utils');

test('Get the last commit sha', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First'], {cwd});

  const result = await getGitHead({cwd});

  t.is(result, commits[0].hash);
});

test('Throw error if the last commit sha cannot be found', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();

  await t.throwsAsync(getGitHead({cwd}));
});

test('Get the head commit on the remote', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  const [commit] = await gitCommits(['First'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  await gitCommits(['Second'], {cwd});

  const result = await getGitRemoteHead(repositoryUrl, 'master', {cwd});

  t.is(result, commit.hash);
});

test('Unshallow and fetch repository', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  let {cwd, repositoryUrl} = await gitRepo();
  // Add commits to the master branch
  await gitCommits(['First', 'Second'], {cwd});
  // Create a shallow clone with only 1 commit
  cwd = await gitShallowClone(repositoryUrl);

  // Verify the shallow clone contains only one commit
  t.is((await gitGetCommits(undefined, {cwd})).length, 1);

  await fetch(repositoryUrl, 'master', 'master', {cwd});

  // Verify the shallow clone contains all the commits
  t.is((await gitGetCommits(undefined, {cwd})).length, 2);
});

test('Do not throw error when unshallow a complete repository', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['First'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  await gitCheckout('second-branch', true, {cwd});
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'second-branch', {cwd});

  await t.notThrowsAsync(fetch(repositoryUrl, 'master', 'master', {cwd}));
  await t.notThrowsAsync(fetch(repositoryUrl, 'second-branch', 'master', {cwd}));
});

test('Fetch all tags on a detached head repository', async (t) => {
  let {cwd, repositoryUrl} = await gitRepo();

  await gitCommits(['First'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitCommits(['Second'], {cwd});
  await gitTagVersion('v1.0.1', undefined, {cwd});
  const [commit] = await gitCommits(['Third'], {cwd});
  await gitTagVersion('v1.1.0', undefined, {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  cwd = await gitDetachedHead(repositoryUrl, commit.hash);

  await fetch(repositoryUrl, 'master', 'master', {cwd});

  t.deepEqual((await getTags('master', {cwd})).sort(), ['v1.0.0', 'v1.0.1', 'v1.1.0'].sort());
});

test('Fetch all tags on a repository with a detached head from branch (CircleCI)', async (t) => {
  let {cwd, repositoryUrl} = await gitRepo();

  await gitCommits(['First'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitCommits(['Second'], {cwd});
  await gitTagVersion('v1.0.1', undefined, {cwd});
  const [commit] = await gitCommits(['Third'], {cwd});
  await gitTagVersion('v1.1.0', undefined, {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  await gitCheckout('other-branch', true, {cwd});
  await gitPush(repositoryUrl, 'other-branch', {cwd});
  await gitCheckout('master', false, {cwd});
  await gitCommits(['Fourth'], {cwd});
  await gitTagVersion('v2.0.0', undefined, {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  cwd = await gitDetachedHeadFromBranch(repositoryUrl, 'other-branch', commit.hash);

  await fetch(repositoryUrl, 'master', 'other-branch', {cwd});
  await fetch(repositoryUrl, 'other-branch', 'other-branch', {cwd});

  t.deepEqual((await getTags('other-branch', {cwd})).sort(), ['v1.0.0', 'v1.0.1', 'v1.1.0'].sort());
  t.deepEqual((await getTags('master', {cwd})).sort(), ['v1.0.0', 'v1.0.1', 'v1.1.0', 'v2.0.0'].sort());
});

test('Fetch all tags on a detached head repository with outdated cached repo (GitLab CI)', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo();

  await gitCommits(['First'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitCommits(['Second'], {cwd});
  await gitTagVersion('v1.0.1', undefined, {cwd});
  let [commit] = await gitCommits(['Third'], {cwd});
  await gitTagVersion('v1.1.0', undefined, {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  // Create a clone (as first CI run would)
  const cloneCwd = await gitShallowClone(repositoryUrl);
  await gitFetch(repositoryUrl, {cwd: cloneCwd});
  await gitCheckout(commit.hash, false, {cwd: cloneCwd});

  // Push tag to remote
  [commit] = await gitCommits(['Fourth'], {cwd});
  await gitTagVersion('v1.2.0', undefined, {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  // Fetch on the cached repo and make detached head, leaving master outdated
  await fetch(repositoryUrl, 'master', 'master', {cwd: cloneCwd});
  await gitCheckout(commit.hash, false, {cwd: cloneCwd});

  t.deepEqual((await getTags('master', {cwd: cloneCwd})).sort(), ['v1.0.0', 'v1.0.1', 'v1.1.0', 'v1.2.0'].sort());
});

test('Fetch all tags not present on the local branch', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo();

  await gitCommits(['First'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  const [commit] = await gitCommits(['Second'], {cwd});
  await gitCommits(['Third'], {cwd});
  await gitTagVersion('v1.1.0', undefined, {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  t.deepEqual((await getNoMergeTags(commit.hash, {cwd})).sort(), ['v1.1.0'].sort());
});

test('Verify if a branch exists', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  // Create the new branch 'other-branch' from master
  await gitCheckout('other-branch', true, {cwd});
  // Add commits to the 'other-branch' branch
  await gitCommits(['Second'], {cwd});

  t.true(await isRefExists('master', {cwd}));
  t.true(await isRefExists('other-branch', {cwd}));
  t.falsy(await isRefExists('next', {cwd}));
});

test('Get all branches', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['First'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  await gitCheckout('second-branch', true, {cwd});
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'second-branch', {cwd});
  await gitCheckout('third-branch', true, {cwd});
  await gitCommits(['Third'], {cwd});
  await gitPush(repositoryUrl, 'third-branch', {cwd});

  t.deepEqual((await getBranches(repositoryUrl, {cwd})).sort(), ['master', 'second-branch', 'third-branch'].sort());
});

test('Return empty array if there are no branches', async (t) => {
  const {cwd, repositoryUrl} = await initGit(true);
  t.deepEqual(await getBranches(repositoryUrl, {cwd}), []);
});

test('Get the commit sha for a given tag', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});

  t.is(await getTagHead('v1.0.0', {cwd}), commits[0].hash);
});

test('Return git remote repository url from config', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add remote.origin.url config
  await gitAddConfig('remote.origin.url', 'git@hostname.com:owner/package.git', {cwd});

  t.is(await repoUrl({cwd}), 'git@hostname.com:owner/package.git');
});

test('Return git remote repository url set while cloning', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  let {cwd, repositoryUrl} = await gitRepo();
  await gitCommits(['First'], {cwd});
  // Create a clone
  cwd = await gitShallowClone(repositoryUrl);

  t.is(await repoUrl({cwd}), repositoryUrl);
});

test('Return falsy if git repository url is not set', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();

  t.falsy(await repoUrl({cwd}));
});

test('Add tag on head commit', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  const commits = await gitCommits(['Test commit'], {cwd});

  await tag('tag_name', 'HEAD', {cwd});

  await t.is(await gitCommitTag(commits[0].hash, {cwd}), 'tag_name');
});

test('Push tag to remote repository', async (t) => {
  // Create a git repository with a remote, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  const commits = await gitCommits(['Test commit'], {cwd});

  await tag('tag_name', 'HEAD', {cwd});
  await push(repositoryUrl, {cwd});

  t.is(await gitRemoteTagHead(repositoryUrl, 'tag_name', {cwd}), commits[0].hash);
});

test('Push tag to remote repository with remote branch ahead', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  const commits = await gitCommits(['First'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  const temporaryRepo = await gitShallowClone(repositoryUrl);
  await gitCommits(['Second'], {cwd: temporaryRepo});
  await gitPush('origin', 'master', {cwd: temporaryRepo});

  await tag('tag_name', 'HEAD', {cwd});
  await push(repositoryUrl, {cwd});

  t.is(await gitRemoteTagHead(repositoryUrl, 'tag_name', {cwd}), commits[0].hash);
});

test('Return "true" if in a Git repository', async (t) => {
  // Create a git repository with a remote, set the current working directory at the root of the repo
  const {cwd} = await gitRepo(true);

  t.true(await isGitRepo({cwd}));
});

test('Return falsy if not in a Git repository', async (t) => {
  const cwd = tempy.directory();

  t.falsy(await isGitRepo({cwd}));
});

test('Return "true" for valid tag names', async (t) => {
  t.true(await verifyTagName('1.0.0'));
  t.true(await verifyTagName('v1.0.0'));
  t.true(await verifyTagName('tag_name'));
  t.true(await verifyTagName('tag/name'));
});

test('Return falsy for invalid tag names', async (t) => {
  t.falsy(await verifyTagName('?1.0.0'));
  t.falsy(await verifyTagName('*1.0.0'));
  t.falsy(await verifyTagName('[1.0.0]'));
  t.falsy(await verifyTagName('1.0.0..'));
});

test('Throws error if obtaining the tags fails', async (t) => {
  const cwd = tempy.directory();

  await t.throwsAsync(getTags('master', {cwd}));
});

test('Get a commit note', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First'], {cwd});

  await gitAddNote(JSON.stringify({note: 'note'}), commits[0].hash, {cwd});

  t.deepEqual(await getNote(commits[0].hash, {cwd}), {note: 'note'});
});

test('Return empty object if there is no commit note', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First'], {cwd});

  t.deepEqual(await getNote(commits[0].hash, {cwd}), {});
});

test('Throw error if a commit note in invalid', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First'], {cwd});

  await gitAddNote('non-json note', commits[0].hash, {cwd});

  await t.throwsAsync(getNote(commits[0].hash, {cwd}));
});

test('Add a commit note', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First'], {cwd});

  await addNote({note: 'note'}, commits[0].hash, {cwd});

  t.is(await gitGetNote(commits[0].hash, {cwd}), '{"note":"note"}');
});

test('Overwrite a commit note', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First'], {cwd});

  await addNote({note: 'note'}, commits[0].hash, {cwd});
  await addNote({note: 'note2'}, commits[0].hash, {cwd});

  t.is(await gitGetNote(commits[0].hash, {cwd}), '{"note":"note2"}');
});

test('Unshallow and fetch repository with notes', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  let {cwd, repositoryUrl} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First', 'Second'], {cwd});
  await gitAddNote(JSON.stringify({note: 'note'}), commits[0].hash, {cwd});
  // Create a shallow clone with only 1 commit
  cwd = await gitShallowClone(repositoryUrl);

  // Verify the shallow clone doesn't contains the note
  await t.throwsAsync(gitGetNote(commits[0].hash, {cwd}));

  await fetch(repositoryUrl, 'master', 'master', {cwd});
  await fetchNotes(repositoryUrl, {cwd});

  // Verify the shallow clone contains the note
  t.is(await gitGetNote(commits[0].hash, {cwd}), '{"note":"note"}');
});

test('Fetch all notes on a detached head repository', async (t) => {
  let {cwd, repositoryUrl} = await gitRepo();

  await gitCommits(['First'], {cwd});
  const [commit] = await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  await gitAddNote(JSON.stringify({note: 'note'}), commit.hash, {cwd});
  cwd = await gitDetachedHead(repositoryUrl, commit.hash);

  await fetch(repositoryUrl, 'master', 'master', {cwd});
  await fetchNotes(repositoryUrl, {cwd});

  t.is(await gitGetNote(commit.hash, {cwd}), '{"note":"note"}');
});

test('Validate that first commit is ancestor of second', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  const [first] = await gitCommits(['First'], {cwd});
  const [second] = await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  t.true(await isAncestor(first.hash, second.hash, {cwd}));
  t.false(await isAncestor(second.hash, first.hash, {cwd}));
});

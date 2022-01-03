const test = require('ava');
const {stub} = require('sinon');
const getCommits = require('../lib/get-commits');
const {gitRepo, gitCommits,gitCommitsWithFiles, gitDetachedHead} = require('./helpers/git-utils');

test.beforeEach((t) => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.error = stub();
  t.context.logger = {log: t.context.log, error: t.context.error};
});

test('Get all commits when there is no last release', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First', 'Second'], {cwd});

  // Retrieve the commits with the commits module
  const result = await getCommits({cwd, lastRelease: {}, logger: t.context.logger});

  // Verify the commits created and retrieved by the module are identical
  t.is(result.length, 2);
  t.deepEqual(result, commits);
});

test('Get all commits since gitHead (from lastRelease)', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First', 'Second', 'Third'], {cwd});

  // Retrieve the commits with the commits module, since commit 'First'
  const result = await getCommits({
    cwd,
    lastRelease: {gitHead: commits[commits.length - 1].hash},
    logger: t.context.logger,
  });

  // Verify the commits created and retrieved by the module are identical
  t.is(result.length, 2);
  t.deepEqual(result, commits.slice(0, 2));
});

test('Get all commits since gitHead (from lastRelease) on a detached head repo', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  let {cwd, repositoryUrl} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First', 'Second', 'Third'], {cwd});
  // Create a detached head repo at commit 'feat: Second'
  cwd = await gitDetachedHead(repositoryUrl, commits[1].hash);

  // Retrieve the commits with the commits module, since commit 'First'
  const result = await getCommits({
    cwd,
    lastRelease: {gitHead: commits[commits.length - 1].hash},
    logger: t.context.logger,
  });

  // Verify the module retrieved only the commit 'feat: Second' (included in the detached and after 'fix: First')
  t.is(result.length, 1);
  t.is(result[0].hash, commits[1].hash);
  t.is(result[0].message, commits[1].message);
  t.truthy(result[0].committerDate);
  t.truthy(result[0].author.name);
  t.truthy(result[0].committer.name);
});

test('Get all commits between lastRelease.gitHead and a shas', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First', 'Second', 'Third'], {cwd});

  // Retrieve the commits with the commits module, between commit 'First' and 'Third'
  const result = await getCommits({
    cwd,
    lastRelease: {gitHead: commits[commits.length - 1].hash},
    nextRelease: {gitHead: commits[1].hash},
    logger: t.context.logger,
  });

  // Verify the commits created and retrieved by the module are identical
  t.is(result.length, 1);
  t.deepEqual(result, commits.slice(1, -1));
});

test('Return empty array if lastRelease.gitHead is the last commit', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First', 'Second'], {cwd});

  // Retrieve the commits with the commits module, since commit 'Second' (therefore none)
  const result = await getCommits({
    cwd,
    lastRelease: {gitHead: commits[0].hash},
    logger: t.context.logger,
  });

  // Verify no commit is retrieved
  t.deepEqual(result, []);
});

test('Return empty array if there is no commits', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();

  // Retrieve the commits with the commits module
  const result = await getCommits({cwd, lastRelease: {}, logger: t.context.logger});

  // Verify no commit is retrieved
  t.deepEqual(result, []);
});

test('Return only commit for module1 path', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  let commitsToCreate = [{message: "message1",files: ["readme.md"]},{message: "message2",files: ["module1/readme.md"]},{message: "message3",files: ["readme1.md","module1/readme2.md"]}]
  let pathFilter = "module1/*"
  commits = await gitCommitsWithFiles(commitsToCreate,{cwd},{cwd})

  // Retrieve the commits with the commits module
  const result = await getCommits({cwd, lastRelease: {}, logger: t.context.logger},pathFilter);

  // Verify only commit is retrieved
  t.deepEqual(result, commits.slice(0,2));
});

test('Return only commit for root path excluding module1 path', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();
  let commitsToCreate = [{message: "message1",files: ["readme.md"]},{message: "message2",files: ["module1/readme.md"]},{message: "message3",files: ["readme1.md","module1/readme2.md"]},{message: "message4",files: ["readme4.md"]}]
  let pathFilter = "^((?!module1).)*$"
  let commits = await gitCommitsWithFiles(commitsToCreate, {cwd}, {cwd})

  // Retrieve the commits with the commits module
  const result = await getCommits({cwd, lastRelease: {}, logger: t.context.logger},pathFilter);

  // Verify only commit is retrieved
  t.deepEqual(result, Array.of().concat(commits.slice(0,2),commits[3]));
});

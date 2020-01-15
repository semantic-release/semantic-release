import test from 'ava';
import {stub} from 'sinon';
import getCommits from '../lib/get-commits';
import {gitRepo, gitCommits, gitDetachedHead, gitCheckout, gitMerge} from './helpers/git-utils';

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.error = stub();
  t.context.logger = {log: t.context.log, error: t.context.error};
});

test('Get all commits when there is no last release', async t => {
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

test('Get all commits since gitHead (from lastRelease)', async t => {
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

/*
Use case: If we have a release branch `release-1` which has been merged into
master and on the master branch we want semantic-release to consider only the
commits which are exclusive to the `master` branch since 'A', then the output
should only include the commits B, C, merged, E and F.

Git history:
-----------------------------

A-B-C-merged-E-F....(master*)
 \   /
  P-Q...........(release-1.0)

-----------------------------
*/
test('Get all commits exclusive to a branch', async t => {
  // Create a git repository, set the current working directory at the root of
  // the repo
  const {cwd} = await gitRepo();

  // Add commits to the master branch
  const commits = await gitCommits(['A', 'B', 'C'], {cwd});
  const firstCommit = commits[commits.length - 1];

  // Checkout 1st commit
  await gitCheckout(firstCommit.hash, false, {cwd});

  // Create and check out release branch. Add commits
  await gitCheckout('release-1.0', true, {cwd});
  await gitCommits(['P', 'Q'], {cwd});

  // Checkout master and merge the release branch
  t.context.logger.log(cwd);
  await gitCheckout('master', false, {cwd});
  await gitMerge('release-1.0', {cwd});

  // Add commits to the master branch
  await gitCommits(['E', 'F'], {cwd});

  // Retrieve the commits with the commits module, since commit 'A'
  const result = await getCommits(
    {
      cwd,
      lastRelease: {gitHead: firstCommit.hash},
      logger: t.context.logger,
    },
    'release-1.0..master'
  );

  // Verify the module retrieved only the commits B, C, merged, E & F
  t.deepEqual(
    result.map(c => c.message),
    ['B', 'C', 'merged', 'E', 'F'].reverse()
  );
});

test('Get all commits since gitHead (from lastRelease) on a detached head repo', async t => {
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

test('Return empty array if lastRelease.gitHead is the last commit', async t => {
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

test('Return empty array if there is no commits', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();

  // Retrieve the commits with the commits module
  const result = await getCommits({cwd, lastRelease: {}, logger: t.context.logger});

  // Verify no commit is retrieved
  t.deepEqual(result, []);
});

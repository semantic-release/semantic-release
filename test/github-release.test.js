import test from 'ava';
import {gitRepo, gitCommits, gitHead} from './helpers/git-utils';
import nock from 'nock';
import {authenticate} from './helpers/mock-github';
import githubRelease from '../lib/github-release';

test.beforeEach(t => {
  // Save the current working diretory
  t.context.cwd = process.cwd();
});

test.afterEach.always(t => {
  // Restore the current working directory
  process.chdir(t.context.cwd);
  // Reset nock
  nock.cleanAll();
});

test.serial('Github release with default url', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  await gitCommits(['fix: First fix', 'feat: Second feature']);

  const sha = await gitHead();
  const owner = 'test_user';
  const repo = 'test_repo';
  const githubToken = 'github_token';
  const notes = 'Test release note body';
  const version = '1.0.0';
  const branch = 'master';
  const tagName = `v${version}`;
  const options = {branch, githubToken};
  const pkg = {version, repository: {url: `git+https://othertesturl.com/${owner}/${repo}.git`}};
  const releaseUrl = `https://othertesturl.com/${owner}/${repo}/releases/${version}`;

  // Mock github API for releases and git/refs endpoints
  const github = authenticate({githubToken})
    .post(`/repos/${owner}/${repo}/releases`, {
      tag_name: tagName,
      target_commitish: branch,
      name: tagName,
      body: notes,
    })
    .reply(200, {html_url: releaseUrl})
    .post(`/repos/${owner}/${repo}/git/refs`, {ref: `refs/tags/${tagName}`, sha})
    .reply({});

  // Call the post module
  t.is(releaseUrl, await githubRelease(pkg, notes, version, options));
  // Verify the releases and git/refs endpoint have been call with expected requests
  t.true(github.isDone());
});

test.serial('Github release with custom url', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  await gitCommits(['fix: First fix', 'feat: Second feature']);

  const sha = await gitHead();
  const owner = 'test_user';
  const repo = 'test_repo';
  const githubUrl = 'https://testurl.com:443';
  const githubToken = 'github_token';
  const githubApiPathPrefix = 'prefix';
  const notes = 'Test release note body';
  const version = '1.0.0';
  const branch = 'master';
  const tagName = `v${version}`;
  const options = {branch, githubUrl, githubToken, githubApiPathPrefix};
  const pkg = {version, repository: {url: `git@othertesturl.com:${owner}/${repo}.git`}};
  const releaseUrl = `https://othertesturl.com/${owner}/${repo}/releases/${version}`;

  // Mock github API for releases and git/refs endpoints
  const github = authenticate({githubUrl, githubToken, githubApiPathPrefix})
    .post(`/repos/${owner}/${repo}/releases`, {
      tag_name: tagName,
      target_commitish: branch,
      name: tagName,
      body: notes,
    })
    .reply(200, {html_url: releaseUrl})
    .post(`/repos/${owner}/${repo}/git/refs`, {ref: `refs/tags/${tagName}`, sha})
    .reply({});

  // Call the post module
  t.is(releaseUrl, await githubRelease(pkg, notes, version, options));
  // Verify the releases and git/refs endpoint have been call with expected requests
  t.true(github.isDone());
});

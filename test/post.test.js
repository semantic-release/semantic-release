import {callbackify} from 'util';
import test from 'ava';
import {gitRepo, gitCommits, gitHead} from './helpers/git-utils';
import {stub} from 'sinon';
import nock from 'nock';
import {authenticate} from './helpers/mock-github';
import post from '../src/post';

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

test.serial('Post run with github token', async t => {
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
  const releaseLog = 'Test release note body';
  // Stub the generateNotes plugin
  const generateNotes = stub().resolves(releaseLog);
  const version = '1.0.0';
  const branch = 'master';
  const debug = false;
  const tagName = `v${version}`;
  const options = {branch, debug, githubUrl, githubToken, githubApiPathPrefix};
  const pkg = {version, repository: {url: `git+https://othertesturl.com/${owner}/${repo}.git`}};

  // Mock github API for releases and git/refs endpoints
  const github = authenticate({githubUrl, githubToken, githubApiPathPrefix})
    .post(`/repos/${owner}/${repo}/releases`, {
      tag_name: tagName,
      target_commitish: branch,
      name: tagName,
      body: releaseLog,
      draft: debug,
    })
    .reply({})
    .post(`/repos/${owner}/${repo}/git/refs`, {ref: `refs/tags/${tagName}`, sha})
    .reply({});

  // Call the post module
  const result = await post({pkg, options, plugins: {generateNotes: callbackify(generateNotes)}});

  // Verify the getLastRelease plugin has been called with 'options' and 'pkg'
  t.true(generateNotes.calledOnce);
  t.deepEqual(generateNotes.firstCall.args[0].options, options);
  t.deepEqual(generateNotes.firstCall.args[0].pkg, pkg);

  // Verify the published release note
  t.deepEqual(result, {
    published: true,
    release: {owner, repo, tag_name: tagName, name: tagName, target_commitish: branch, draft: debug, body: releaseLog},
  });
  // Verify the releases and git/refs endpoint have been call with expected requests
  t.true(github.isDone());
});

test.serial('Post dry run with github token', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  await gitCommits(['fix: First fix', 'feat: Second feature']);

  const owner = 'test_user';
  const repo = 'test_repo';
  const githubToken = 'github_token';
  const releaseLog = 'Test release note body';
  // Stub the generateNotes plugin
  const generateNotes = stub().resolves(releaseLog);
  const version = '1.0.0';
  const branch = 'master';
  const debug = true;
  const tagName = `v${version}`;
  const options = {branch, debug, githubToken};
  const pkg = {version, repository: {url: `git+https://othertesturl.com/${owner}/${repo}.git`}};

  // Mock github API for releases endpoint
  const github = authenticate({githubToken})
    .post(`/repos/${owner}/${repo}/releases`, {
      tag_name: tagName,
      target_commitish: branch,
      name: tagName,
      body: releaseLog,
      draft: debug,
    })
    .reply({});

  // Call the post module
  const result = await post({pkg, options, plugins: {generateNotes: callbackify(generateNotes)}});

  // Verify the getLastRelease plugin has been called with 'options' and 'pkg'
  t.true(generateNotes.calledOnce);
  t.deepEqual(generateNotes.firstCall.args[0].options, options);
  t.deepEqual(generateNotes.firstCall.args[0].pkg, pkg);

  // Verify the published release note
  t.deepEqual(result, {
    published: true,
    release: {owner, repo, tag_name: tagName, name: tagName, target_commitish: branch, draft: debug, body: releaseLog},
  });
  // Verify the releases and git/refs endpoint have been call with expected requests
  t.true(github.isDone());
});

test.serial('Post dry run without github token', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  await gitCommits(['fix: First fix', 'feat: Second feature']);

  const owner = 'test_user';
  const repo = 'test_repo';
  const releaseLog = 'Test release note body';
  // Stub the generateNotes plugin
  const generateNotes = stub().resolves(releaseLog);
  const version = '1.0.0';
  const branch = 'master';
  const debug = true;
  const tagName = `v${version}`;
  const options = {branch, debug};
  const pkg = {version, repository: {url: `git+https://othertesturl.com/${owner}/${repo}.git`}};

  // Call the post module
  const result = await post({pkg, options, plugins: {generateNotes: callbackify(generateNotes)}});

  // Verify the getLastRelease plugin has been called with 'options' and 'pkg'
  t.true(generateNotes.calledOnce);
  t.deepEqual(generateNotes.firstCall.args[0].options, options);
  t.deepEqual(generateNotes.firstCall.args[0].pkg, pkg);

  // Verify the release note
  t.deepEqual(result, {
    published: false,
    release: {owner, repo, tag_name: tagName, name: tagName, target_commitish: branch, draft: debug, body: releaseLog},
  });
});

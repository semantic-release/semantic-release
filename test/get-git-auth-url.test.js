const test = require('ava');
const getAuthUrl = require('../lib/get-git-auth-url');
const {gitRepo} = require('./helpers/git-utils');

const env = {GIT_ASKPASS: 'echo', GIT_TERMINAL_PROMPT: 0};

test('Return the same "git" formatted URL if "gitCredentials" is not defined', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({cwd, env, branch: {name: 'master'}, options: {repositoryUrl: 'git@host.null:owner/repo.git'}}),
    'git@host.null:owner/repo.git'
  );
});

test('Return the same "https" formatted URL if "gitCredentials" is not defined', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env,
      branch: {name: 'master'},
      options: {repositoryUrl: 'https://host.null/owner/repo.git'},
    }),
    'https://host.null/owner/repo.git'
  );
});

test('Return the "https" formatted URL if "gitCredentials" is not defined and repositoryUrl is a "git+https" URL', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env,
      branch: {name: 'master'},
      options: {repositoryUrl: 'git+https://host.null/owner/repo.git'},
    }),
    'https://host.null/owner/repo.git'
  );
});

test('Do not add trailing ".git" if not present in the origian URL', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({cwd, env, vranch: {name: 'master'}, options: {repositoryUrl: 'git@host.null:owner/repo'}}),
    'git@host.null:owner/repo'
  );
});

test('Handle "https" URL with group and subgroup', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env,
      branch: {name: 'master'},
      options: {repositoryUrl: 'https://host.null/group/subgroup/owner/repo.git'},
    }),
    'https://host.null/group/subgroup/owner/repo.git'
  );
});

test('Handle "git" URL with group and subgroup', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env,
      branch: {name: 'master'},
      options: {repositoryUrl: 'git@host.null:group/subgroup/owner/repo.git'},
    }),
    'git@host.null:group/subgroup/owner/repo.git'
  );
});

test('Convert shorthand URL', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env,
      branch: {name: 'master'},
      options: {repositoryUrl: 'semantic-release/semantic-release'},
    }),
    'https://github.com/semantic-release/semantic-release.git'
  );
});

test('Convert GitLab shorthand URL', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env,
      branch: {name: 'master'},
      options: {repositoryUrl: 'gitlab:semantic-release/semantic-release'},
    }),
    'https://gitlab.com/semantic-release/semantic-release.git'
  );
});

test('Return the "https" formatted URL if "gitCredentials" is defined and repositoryUrl is a "git" URL', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GIT_CREDENTIALS: 'user:pass'},
      branch: {name: 'master'},
      options: {repositoryUrl: 'git@host.null:owner/repo.git'},
    }),
    'https://user:pass@host.null/owner/repo.git'
  );
});

test('Return the "https" formatted URL if "gitCredentials" is defined and repositoryUrl is a "git" URL without user', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GIT_CREDENTIALS: 'user:pass'},
      options: {branch: 'master', repositoryUrl: 'host.null:owner/repo.git'},
    }),
    'https://user:pass@host.null/owner/repo.git'
  );
});

test('Return the "https" formatted URL if "gitCredentials" is defined and repositoryUrl is a "https" URL', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GIT_CREDENTIALS: 'user:pass'},
      branch: {name: 'master'},
      options: {repositoryUrl: 'https://host.null/owner/repo.git'},
    }),
    'https://user:pass@host.null/owner/repo.git'
  );
});

test('Return the "http" formatted URL if "gitCredentials" is defined and repositoryUrl is a "http" URL', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GIT_CREDENTIALS: 'user:pass'},
      branch: {name: 'master'},
      options: {repositoryUrl: 'http://host.null/owner/repo.git'},
    }),
    'http://user:pass@host.null/owner/repo.git'
  );
});

test('Return the "http" formatted URL if "gitCredentials" is defined and repositoryUrl is a "http" URL with custom port', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GIT_CREDENTIALS: 'user:pass'},
      options: {branch: 'master', repositoryUrl: 'http://host.null:8080/owner/repo.git'},
    }),
    'http://user:pass@host.null:8080/owner/repo.git'
  );
});

test('Return the "https" formatted URL if "gitCredentials" is defined and repositoryUrl is a "git+https" URL', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GIT_CREDENTIALS: 'user:pass'},
      branch: {name: 'master'},
      options: {repositoryUrl: 'git+https://host.null/owner/repo.git'},
    }),
    'https://user:pass@host.null/owner/repo.git'
  );
});

test('Return the "http" formatted URL if "gitCredentials" is defined and repositoryUrl is a "git+http" URL', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GIT_CREDENTIALS: 'user:pass'},
      branch: {name: 'master'},
      options: {repositoryUrl: 'git+http://host.null/owner/repo.git'},
    }),
    'http://user:pass@host.null/owner/repo.git'
  );
});

test('Return the "http" formatted URL if "gitCredentials" is defined and repositoryUrl is a "ssh" URL', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GIT_CREDENTIALS: 'user:pass'},
      options: {branch: 'master', repositoryUrl: 'ssh://git@host.null:2222/owner/repo.git'},
    }),
    'https://user:pass@host.null/owner/repo.git'
  );
});

test('Return the "https" formatted URL if "gitCredentials" is defined with "GH_TOKEN"', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GH_TOKEN: 'token'},
      branch: {name: 'master'},
      options: {repositoryUrl: 'git@host.null:owner/repo.git'},
    }),
    'https://token@host.null/owner/repo.git'
  );
});

test('Return the "https" formatted URL if "gitCredentials" is defined with "GITHUB_TOKEN"', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GITHUB_TOKEN: 'token'},
      branch: {name: 'master'},
      options: {repositoryUrl: 'git@host.null:owner/repo.git'},
    }),
    'https://token@host.null/owner/repo.git'
  );
});

test('Return the "https" formatted URL if "gitCredentials" is defined with "GL_TOKEN"', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GL_TOKEN: 'token'},
      branch: {name: 'master'},
      options: {repositoryUrl: 'git@host.null:owner/repo.git'},
    }),
    'https://gitlab-ci-token:token@host.null/owner/repo.git'
  );
});

test('Return the "https" formatted URL if "gitCredentials" is defined with "GITLAB_TOKEN"', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GITLAB_TOKEN: 'token'},
      branch: {name: 'master'},
      options: {repositoryUrl: 'git@host.null:owner/repo.git'},
    }),
    'https://gitlab-ci-token:token@host.null/owner/repo.git'
  );
});

test('Return the "https" formatted URL if "gitCredentials" is defined with "BB_TOKEN"', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, BB_TOKEN: 'token'},
      branch: {name: 'master'},
      options: {repositoryUrl: 'git@host.null:owner/repo.git'},
    }),
    'https://x-token-auth:token@host.null/owner/repo.git'
  );
});

test('Return the "https" formatted URL if "gitCredentials" is defined with "BITBUCKET_TOKEN"', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, BITBUCKET_TOKEN: 'token'},
      branch: {name: 'master'},
      options: {repositoryUrl: 'git@host.null:owner/repo.git'},
    }),
    'https://x-token-auth:token@host.null/owner/repo.git'
  );
});

test('Return the "https" formatted URL if "GITHUB_ACTION" is set', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GITHUB_ACTION: 'foo', GITHUB_TOKEN: 'token'},
      options: {branch: 'master', repositoryUrl: 'git@host.null:owner/repo.git'},
    }),
    'https://x-access-token:token@host.null/owner/repo.git'
  );
});

test('Handle "https" URL with group and subgroup, with "GIT_CREDENTIALS"', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GIT_CREDENTIALS: 'user:pass'},
      branch: {name: 'master'},
      options: {repositoryUrl: 'https://host.null/group/subgroup/owner/repo.git'},
    }),
    'https://user:pass@host.null/group/subgroup/owner/repo.git'
  );
});

test('Handle "git" URL with group and subgroup, with "GIT_CREDENTIALS', async t => {
  const {cwd} = await gitRepo();

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GIT_CREDENTIALS: 'user:pass'},
      branch: {name: 'master'},
      options: {repositoryUrl: 'git@host.null:group/subgroup/owner/repo.git'},
    }),
    'https://user:pass@host.null/group/subgroup/owner/repo.git'
  );
});

test('Do not add git credential to repositoryUrl if push is allowed', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);

  t.is(
    await getAuthUrl({
      cwd,
      env: {...env, GIT_CREDENTIALS: 'user:pass'},
      branch: {name: 'master'},
      options: {repositoryUrl},
    }),
    repositoryUrl
  );
});

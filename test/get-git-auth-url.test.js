import test from 'ava';
import getAuthUrl from '../lib/get-git-auth-url';

// Save the current process.env
const envBackup = Object.assign({}, process.env);

test.beforeEach(() => {
  // Restore process.env
  process.env = {};
});

test.afterEach.always(() => {
  // Restore process.env
  process.env = envBackup;
});

test.serial('Return the same "repositoryUrl" is no "gitCredentials" is defined', t => {
  t.is(getAuthUrl('git@host.com:owner/repo.git'), 'git@host.com:owner/repo.git');
});

test.serial('Return the "https" formatted URL if "gitCredentials" is defined and repositoryUrl is a "git" URL', t => {
  process.env.GIT_CREDENTIALS = 'user:pass';
  t.is(getAuthUrl('git@host.com:owner/repo.git'), 'https://user:pass@host.com/owner/repo.git');
});

test.serial('Return the "https" formatted URL if "gitCredentials" is defined and repositoryUrl is a "https" URL', t => {
  process.env.GIT_CREDENTIALS = 'user:pass';
  t.is(getAuthUrl('https://host.com/owner/repo.git'), 'https://user:pass@host.com/owner/repo.git');
});

test.serial('Return the "http" formatted URL if "gitCredentials" is defined and repositoryUrl is a "http" URL', t => {
  process.env.GIT_CREDENTIALS = 'user:pass';
  t.is(getAuthUrl('http://host.com/owner/repo.git'), 'http://user:pass@host.com/owner/repo.git');
});

test.serial(
  'Return the "https" formatted URL if "gitCredentials" is defined and repositoryUrl is a "git+https" URL',
  t => {
    process.env.GIT_CREDENTIALS = 'user:pass';
    t.is(getAuthUrl('git+https://host.com/owner/repo.git'), 'https://user:pass@host.com/owner/repo.git');
  }
);

test.serial(
  'Return the "http" formatted URL if "gitCredentials" is defined and repositoryUrl is a "git+http" URL',
  t => {
    process.env.GIT_CREDENTIALS = 'user:pass';
    t.is(getAuthUrl('git+http://host.com/owner/repo.git'), 'http://user:pass@host.com/owner/repo.git');
  }
);

test.serial('Return the "https" formatted URL if "gitCredentials" is defined with "GH_TOKEN"', t => {
  process.env.GH_TOKEN = 'token';
  t.is(getAuthUrl('git@host.com:owner/repo.git'), 'https://token@host.com/owner/repo.git');
});

test.serial('Return the "https" formatted URL if "gitCredentials" is defined with "GITHUB_TOKEN"', t => {
  process.env.GITHUB_TOKEN = 'token';
  t.is(getAuthUrl('git@host.com:owner/repo.git'), 'https://token@host.com/owner/repo.git');
});

test.serial('Return the "https" formatted URL if "gitCredentials" is defined with "GL_TOKEN"', t => {
  process.env.GL_TOKEN = 'token';
  t.is(getAuthUrl('git@host.com:owner/repo.git'), 'https://gitlab-ci-token:token@host.com/owner/repo.git');
});

test.serial('Return the "https" formatted URL if "gitCredentials" is defined with "GITLAB_TOKEN"', t => {
  process.env.GITLAB_TOKEN = 'token';
  t.is(getAuthUrl('git@host.com:owner/repo.git'), 'https://gitlab-ci-token:token@host.com/owner/repo.git');
});

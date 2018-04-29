import test from 'ava';
import getAuthUrl from '../lib/get-git-auth-url';
import {gitRepo} from './helpers/git-utils';

// Save the current process.env
const envBackup = Object.assign({}, process.env);
// Save the current working diretory
const cwd = process.cwd();

test.beforeEach(() => {
  delete process.env.GIT_CREDENTIALS;
  delete process.env.GH_TOKEN;
  delete process.env.GITHUB_TOKEN;
  delete process.env.GL_TOKEN;
  delete process.env.GITLAB_TOKEN;
  process.env.GIT_ASKPASS = 'echo';
  process.env.GIT_TERMINAL_PROMPT = 0;
});

test.afterEach.always(() => {
  // Restore process.env
  process.env = envBackup;
  // Restore the current working directory
  process.chdir(cwd);
});

test.serial('Return the same "git" formatted URL if "gitCredentials" is not defined', async t => {
  t.is(await getAuthUrl({repositoryUrl: 'git@host.null:owner/repo.git'}), 'git@host.null:owner/repo.git');
});

test.serial('Return the same "https" formatted URL if "gitCredentials" is not defined', async t => {
  t.is(await getAuthUrl({repositoryUrl: 'https://host.null/owner/repo.git'}), 'https://host.null/owner/repo.git');
});

test.serial(
  'Return the "https" formatted URL if "gitCredentials" is not defined and repositoryUrl is a "git+https" URL',
  async t => {
    t.is(await getAuthUrl({repositoryUrl: 'git+https://host.null/owner/repo.git'}), 'https://host.null/owner/repo.git');
  }
);

test.serial('Do not add trailing ".git" if not present in the origian URL', async t => {
  t.is(await getAuthUrl({repositoryUrl: 'git@host.null:owner/repo'}), 'git@host.null:owner/repo');
});

test.serial('Handle "https" URL with group and subgroup', async t => {
  t.is(
    await getAuthUrl({repositoryUrl: 'https://host.null/group/subgroup/owner/repo.git'}),
    'https://host.null/group/subgroup/owner/repo.git'
  );
});

test.serial('Handle "git" URL with group and subgroup', async t => {
  t.is(
    await getAuthUrl({repositoryUrl: 'git@host.null:group/subgroup/owner/repo.git'}),
    'git@host.null:group/subgroup/owner/repo.git'
  );
});

test.serial('Convert shorthand URL', async t => {
  t.is(
    await getAuthUrl({repositoryUrl: 'semanitc-release/semanitc-release'}),
    'https://github.com/semanitc-release/semanitc-release.git'
  );
});

test.serial('Convert GitLab shorthand URL', async t => {
  t.is(
    await getAuthUrl({repositoryUrl: 'gitlab:semanitc-release/semanitc-release'}),
    'https://gitlab.com/semanitc-release/semanitc-release.git'
  );
});

test.serial(
  'Return the "https" formatted URL if "gitCredentials" is defined and repositoryUrl is a "git" URL',
  async t => {
    process.env.GIT_CREDENTIALS = 'user:pass';
    t.is(
      await getAuthUrl({repositoryUrl: 'git@host.null:owner/repo.git'}),
      'https://user:pass@host.null/owner/repo.git'
    );
  }
);

test.serial(
  'Return the "https" formatted URL if "gitCredentials" is defined and repositoryUrl is a "https" URL',
  async t => {
    process.env.GIT_CREDENTIALS = 'user:pass';
    t.is(
      await getAuthUrl({repositoryUrl: 'https://host.null/owner/repo.git'}),
      'https://user:pass@host.null/owner/repo.git'
    );
  }
);

test.serial(
  'Return the "http" formatted URL if "gitCredentials" is defined and repositoryUrl is a "http" URL',
  async t => {
    process.env.GIT_CREDENTIALS = 'user:pass';
    t.is(
      await getAuthUrl({repositoryUrl: 'http://host.null/owner/repo.git'}),
      'http://user:pass@host.null/owner/repo.git'
    );
  }
);

test.serial(
  'Return the "https" formatted URL if "gitCredentials" is defined and repositoryUrl is a "git+https" URL',
  async t => {
    process.env.GIT_CREDENTIALS = 'user:pass';
    t.is(
      await getAuthUrl({repositoryUrl: 'git+https://host.null/owner/repo.git'}),
      'https://user:pass@host.null/owner/repo.git'
    );
  }
);

test.serial(
  'Return the "http" formatted URL if "gitCredentials" is defined and repositoryUrl is a "git+http" URL',
  async t => {
    process.env.GIT_CREDENTIALS = 'user:pass';
    t.is(
      await getAuthUrl({repositoryUrl: 'git+http://host.null/owner/repo.git'}),
      'http://user:pass@host.null/owner/repo.git'
    );
  }
);

test.serial('Return the "https" formatted URL if "gitCredentials" is defined with "GH_TOKEN"', async t => {
  process.env.GH_TOKEN = 'token';
  t.is(await getAuthUrl({repositoryUrl: 'git@host.null:owner/repo.git'}), 'https://token@host.null/owner/repo.git');
});

test.serial('Return the "https" formatted URL if "gitCredentials" is defined with "GITHUB_TOKEN"', async t => {
  process.env.GITHUB_TOKEN = 'token';
  t.is(await getAuthUrl({repositoryUrl: 'git@host.null:owner/repo.git'}), 'https://token@host.null/owner/repo.git');
});

test.serial('Return the "https" formatted URL if "gitCredentials" is defined with "GL_TOKEN"', async t => {
  process.env.GL_TOKEN = 'token';
  t.is(
    await getAuthUrl({repositoryUrl: 'git@host.null:owner/repo.git'}),
    'https://gitlab-ci-token:token@host.null/owner/repo.git'
  );
});

test.serial('Return the "https" formatted URL if "gitCredentials" is defined with "GITLAB_TOKEN"', async t => {
  process.env.GITLAB_TOKEN = 'token';
  t.is(
    await getAuthUrl({repositoryUrl: 'git@host.null:owner/repo.git'}),
    'https://gitlab-ci-token:token@host.null/owner/repo.git'
  );
});

test.serial('Handle "https" URL with group and subgroup, with "GIT_CREDENTIALS"', async t => {
  process.env.GIT_CREDENTIALS = 'user:pass';
  t.is(
    await getAuthUrl({repositoryUrl: 'https://host.null/group/subgroup/owner/repo.git'}),
    'https://user:pass@host.null/group/subgroup/owner/repo.git'
  );
});

test.serial('Handle "git" URL with group and subgroup, with "GIT_CREDENTIALS', async t => {
  process.env.GIT_CREDENTIALS = 'user:pass';
  t.is(
    await getAuthUrl({repositoryUrl: 'git@host.null:group/subgroup/owner/repo.git'}),
    'https://user:pass@host.null/group/subgroup/owner/repo.git'
  );
});

test.serial('Do not add git credential to repositoryUrl if push is allowed', async t => {
  process.env.GIT_CREDENTIALS = 'user:pass';
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);

  t.is(await getAuthUrl({repositoryUrl}), repositoryUrl);
});

import test from 'ava';
import proxyquire from 'proxyquire';
import {stub} from 'sinon';
import tempy from 'tempy';
import DEFINITIONS from '../lib/plugins/definitions';
import {gitHead as getGitHead} from '../lib/git';
import {gitRepo, gitCommits, gitTagVersion} from './helpers/git-utils';

// Save the current process.env
const envBackup = Object.assign({}, process.env);
// Save the current working diretory
const cwd = process.cwd();

stub(process.stdout, 'write');
stub(process.stderr, 'write');

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.error = stub();
  t.context.logger = {log: t.context.log, error: t.context.error};
});

test.afterEach.always(() => {
  // Restore process.env
  process.env = envBackup;
  // Restore the current working directory
  process.chdir(cwd);
});

test.serial('Plugins are called with expected values', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  let commits = await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  commits = (await gitCommits(['Second'])).concat(commits);

  const lastRelease = {version: '1.0.0', gitHead: commits[commits.length - 1].hash, gitTag: 'v1.0.0'};
  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const notes = 'Release notes';
  const verifyConditions1 = stub().resolves();
  const verifyConditions2 = stub().resolves();
  const getLastRelease = stub().resolves(lastRelease);
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const publish = stub().resolves();

  const config = {branch: 'master', repositoryUrl: 'git@hostname.com:owner/module.git', globalOpt: 'global'};
  const options = {
    ...config,
    verifyConditions: [verifyConditions1, verifyConditions2],
    getLastRelease,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    publish,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(await semanticRelease(options));

  t.is(verifyConditions1.callCount, 1);
  t.deepEqual(verifyConditions1.args[0][0], config);
  t.deepEqual(verifyConditions1.args[0][1], {options, logger: t.context.logger});
  t.is(verifyConditions2.callCount, 1);
  t.deepEqual(verifyConditions2.args[0][1], {options, logger: t.context.logger});

  t.is(getLastRelease.callCount, 1);
  t.deepEqual(getLastRelease.args[0][0], config);
  t.deepEqual(getLastRelease.args[0][1], {options, logger: t.context.logger});

  t.is(analyzeCommits.callCount, 1);
  t.deepEqual(analyzeCommits.args[0][0], config);
  t.deepEqual(analyzeCommits.args[0][1].options, options);
  t.deepEqual(analyzeCommits.args[0][1].logger, t.context.logger);
  t.deepEqual(analyzeCommits.args[0][1].lastRelease, lastRelease);
  t.deepEqual(analyzeCommits.args[0][1].commits[0].hash.substring(0, 7), commits[0].hash);
  t.deepEqual(analyzeCommits.args[0][1].commits[0].message, commits[0].message);

  t.is(verifyRelease.callCount, 1);
  t.deepEqual(verifyRelease.args[0][0], config);
  t.deepEqual(verifyRelease.args[0][1].options, options);
  t.deepEqual(verifyRelease.args[0][1].logger, t.context.logger);
  t.deepEqual(verifyRelease.args[0][1].lastRelease, lastRelease);
  t.deepEqual(verifyRelease.args[0][1].commits[0].hash.substring(0, 7), commits[0].hash);
  t.deepEqual(verifyRelease.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(verifyRelease.args[0][1].nextRelease, nextRelease);

  t.is(generateNotes.callCount, 1);
  t.deepEqual(generateNotes.args[0][0], config);
  t.deepEqual(generateNotes.args[0][1].options, options);
  t.deepEqual(generateNotes.args[0][1].logger, t.context.logger);
  t.deepEqual(generateNotes.args[0][1].lastRelease, lastRelease);
  t.deepEqual(generateNotes.args[0][1].commits[0].hash.substring(0, 7), commits[0].hash);
  t.deepEqual(generateNotes.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(generateNotes.args[0][1].nextRelease, nextRelease);

  t.is(publish.callCount, 1);
  t.deepEqual(publish.args[0][0], config);
  t.deepEqual(publish.args[0][1].options, options);
  t.deepEqual(publish.args[0][1].logger, t.context.logger);
  t.deepEqual(publish.args[0][1].lastRelease, lastRelease);
  t.deepEqual(publish.args[0][1].commits[0].hash.substring(0, 7), commits[0].hash);
  t.deepEqual(publish.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(publish.args[0][1].nextRelease, Object.assign({}, nextRelease, {notes}));
});

test.serial('Use new gitHead, and recreate release notes if a publish plugin create a commit', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  let commits = await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  commits = (await gitCommits(['Second'])).concat(commits);

  const lastRelease = {version: '1.0.0', gitHead: commits[commits.length - 1].hash, gitTag: 'v1.0.0'};
  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const notes = 'Release notes';

  const generateNotes = stub().resolves(notes);
  const publish1 = stub().callsFake(async () => {
    await gitCommits(['Third']);
  });
  const publish2 = stub().resolves();

  const options = {
    branch: 'master',
    repositoryUrl: 'git@hostname.com:owner/module.git',
    verifyConditions: stub().resolves(),
    getLastRelease: stub().resolves(lastRelease),
    analyzeCommits: stub().resolves(nextRelease.type),
    verifyRelease: stub().resolves(),
    generateNotes,
    publish: [publish1, publish2],
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(await semanticRelease(options));

  t.is(generateNotes.callCount, 2);
  t.deepEqual(generateNotes.args[0][1].nextRelease, nextRelease);
  t.is(publish1.callCount, 1);
  t.deepEqual(publish1.args[0][1].nextRelease, Object.assign({}, nextRelease, {notes}));

  nextRelease.gitHead = await getGitHead();

  t.deepEqual(generateNotes.secondCall.args[1].nextRelease, Object.assign({}, nextRelease, {notes}));
  t.is(publish2.callCount, 1);
  t.deepEqual(publish2.args[0][1].nextRelease, Object.assign({}, nextRelease, {notes}));
});

test.serial('Dry-run skips publish', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  let commits = await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  commits = (await gitCommits(['Second'])).concat(commits);

  const lastRelease = {version: '1.0.0', gitHead: commits[commits.length - 1].hash, gitTag: 'v1.0.0'};
  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const notes = 'Release notes';

  const verifyConditions = stub().resolves();
  const getLastRelease = stub().resolves(lastRelease);
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const publish = stub().resolves();

  const options = {
    dryRun: true,
    branch: 'master',
    repositoryUrl: 'git@hostname.com:owner/module.git',
    verifyConditions,
    getLastRelease,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    publish,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(await semanticRelease(options));

  t.not(t.context.log.args[0][0], 'This run was not triggered in a known CI environment, running in dry-run mode.');
  t.is(verifyConditions.callCount, 1);
  t.is(getLastRelease.callCount, 1);
  t.is(analyzeCommits.callCount, 1);
  t.is(verifyRelease.callCount, 1);
  t.is(generateNotes.callCount, 1);
  t.is(publish.callCount, 0);
});

test.serial('Force a dry-run if not on a CI and ignore "noCi" is not explicitly set', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  let commits = await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  commits = (await gitCommits(['Second'])).concat(commits);

  const lastRelease = {version: '1.0.0', gitHead: commits[commits.length - 1].hash, gitTag: 'v1.0.0'};
  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const notes = 'Release notes';

  const verifyConditions = stub().resolves();
  const getLastRelease = stub().resolves(lastRelease);
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const publish = stub().resolves();

  const options = {
    dryRun: false,
    branch: 'master',
    repositoryUrl: 'git@hostname.com:owner/module.git',
    verifyConditions,
    getLastRelease,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    publish,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: false, branch: 'master'}),
  });
  t.truthy(await semanticRelease(options));

  t.is(t.context.log.args[0][0], 'This run was not triggered in a known CI environment, running in dry-run mode.');
  t.is(verifyConditions.callCount, 1);
  t.is(getLastRelease.callCount, 1);
  t.is(analyzeCommits.callCount, 1);
  t.is(verifyRelease.callCount, 1);
  t.is(generateNotes.callCount, 1);
  t.is(publish.callCount, 0);
});

test.serial('Allow local releases with "noCi" option', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  let commits = await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  commits = (await gitCommits(['Second'])).concat(commits);

  const lastRelease = {version: '1.0.0', gitHead: commits[commits.length - 1].hash, gitTag: 'v1.0.0'};
  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const notes = 'Release notes';

  const verifyConditions = stub().resolves();
  const getLastRelease = stub().resolves(lastRelease);
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const publish = stub().resolves();

  const options = {
    noCi: true,
    branch: 'master',
    repositoryUrl: 'git@hostname.com:owner/module.git',
    verifyConditions,
    getLastRelease,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    publish,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: false, branch: 'master', isPr: true}),
  });
  t.truthy(await semanticRelease(options));

  t.not(t.context.log.args[0][0], 'This run was not triggered in a known CI environment, running in dry-run mode.');
  t.not(
    t.context.log.args[0][0],
    "This run was triggered by a pull request and therefore a new version won't be published."
  );
  t.is(verifyConditions.callCount, 1);
  t.is(getLastRelease.callCount, 1);
  t.is(analyzeCommits.callCount, 1);
  t.is(verifyRelease.callCount, 1);
  t.is(generateNotes.callCount, 1);
  t.is(publish.callCount, 1);
});

test.serial('Accept "undefined" values for the "getLastRelease" and "generateNotes" plugins', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  await gitCommits(['Second']);

  const lastRelease = {gitHead: undefined, gitTag: undefined, version: undefined};
  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const verifyConditions = stub().resolves();
  const getLastRelease = stub().resolves();
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves();
  const publish = stub().resolves();

  const options = {
    branch: 'master',
    repositoryUrl: 'git@hostname.com:owner/module.git',
    verifyConditions: [verifyConditions],
    getLastRelease,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    publish,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(await semanticRelease(options));

  t.is(getLastRelease.callCount, 1);

  t.is(analyzeCommits.callCount, 1);
  t.deepEqual(analyzeCommits.args[0][1].lastRelease, lastRelease);

  t.is(verifyRelease.callCount, 1);
  t.deepEqual(verifyRelease.args[0][1].lastRelease, lastRelease);

  t.is(generateNotes.callCount, 1);
  t.deepEqual(generateNotes.args[0][1].lastRelease, lastRelease);

  t.is(publish.callCount, 1);
  t.deepEqual(publish.args[0][1].lastRelease, lastRelease);
  t.falsy(publish.args[0][1].nextRelease.notes);
});

test.serial('Returns falsy value if not running from a git repository', async t => {
  // Set the current working directory to a temp directory
  process.chdir(tempy.directory());

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.falsy(await semanticRelease());
  t.is(t.context.error.args[0][0], 'Semantic-release must run from a git repository.');
});

test.serial('Returns falsy value if triggered by a PR', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: true}),
  });

  t.falsy(await semanticRelease({repositoryUrl: 'git@hostname.com:owner/module.git'}));
  t.is(
    t.context.log.args[0][0],
    "This run was triggered by a pull request and therefore a new version won't be published."
  );
});

test.serial('Returns falsy value if not running from the configured branch', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();

  const verifyConditions = stub().resolves();
  const getLastRelease = stub().resolves();
  const analyzeCommits = stub().resolves();
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves();
  const publish = stub().resolves();

  const options = {
    branch: 'master',
    repositoryUrl: 'git@hostname.com:owner/module.git',
    verifyConditions: [verifyConditions],
    getLastRelease,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    publish,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'other-branch', isPr: false}),
  });

  t.falsy(await semanticRelease(options));
  t.is(
    t.context.log.args[0][0],
    'This test run was triggered on the branch other-branch, while semantic-release is configured to only publish from master, therefore a new version won’t be published.'
  );
});

test.serial('Returns falsy value if there is no relevant changes', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  await gitCommits(['First']);

  const verifyConditions = stub().resolves();
  const getLastRelease = stub().resolves();
  const analyzeCommits = stub().resolves();
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves();
  const publish = stub().resolves();

  const options = {
    branch: 'master',
    repositoryUrl: 'git@hostname.com:owner/module.git',
    verifyConditions: [verifyConditions],
    getLastRelease,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    publish,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  t.falsy(await semanticRelease(options));
  t.is(analyzeCommits.callCount, 1);
  t.is(verifyRelease.callCount, 0);
  t.is(generateNotes.callCount, 0);
  t.is(publish.callCount, 0);
  t.is(t.context.log.args[6][0], 'There are no relevant changes, so no new version is released.');
});

test.serial('Exclude commits with [skip release] or [release skip] from analysis', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits([
    'Test commit',
    'Test commit [skip release]',
    'Test commit [release skip]',
    'Test commit [Release Skip]',
    'Test commit [Skip Release]',
    'Test commit [skip    release]',
    'Test commit\n\n commit body\n[skip release]',
    'Test commit\n\n commit body\n[release skip]',
  ]);

  const verifyConditions1 = stub().resolves();
  const verifyConditions2 = stub().resolves();
  const getLastRelease = stub().resolves({});
  const analyzeCommits = stub().resolves();
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves();
  const publish = stub().resolves();

  const config = {branch: 'master', repositoryUrl: 'git@hostname.com:owner/module.git', globalOpt: 'global'};
  const options = {
    ...config,
    verifyConditions: [verifyConditions1, verifyConditions2],
    getLastRelease,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    publish,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  await semanticRelease(options);

  t.is(analyzeCommits.callCount, 1);
  t.is(analyzeCommits.args[0][1].commits.length, 1);
  t.deepEqual(analyzeCommits.args[0][1].commits[0].hash.substring(0, 7), commits[commits.length - 1].hash);
  t.deepEqual(analyzeCommits.args[0][1].commits[0].message, commits[commits.length - 1].message);
});

test.serial('Throw SemanticReleaseError if repositoryUrl is not set and cannot be found from repo config', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const error = await t.throws(semanticRelease());

  // Verify error code and type
  t.is(error.code, 'ENOREPOURL');
  t.is(error.name, 'SemanticReleaseError');
});

test.serial('Throw an Error if plugin returns an unexpected value', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  await gitCommits(['Second']);

  const verifyConditions = stub().resolves();
  const getLastRelease = stub().resolves('string');

  const options = {
    branch: 'master',
    repositoryUrl: 'git@hostname.com:owner/module.git',
    verifyConditions: [verifyConditions],
    getLastRelease,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const error = await t.throws(semanticRelease(options), Error);

  // Verify error message
  t.regex(error.message, new RegExp(DEFINITIONS.getLastRelease.output.message));
  t.regex(error.message, /Received: 'string'/);
});

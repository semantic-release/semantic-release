import test from 'ava';
import proxyquire from 'proxyquire';
import {stub} from 'sinon';
import tempy from 'tempy';
import DEFINITIONS from '../lib/plugins/definitions';
import {gitHead as getGitHead} from '../lib/git';
import {gitRepo, gitCommits, gitTagVersion} from './helpers/git-utils';

test.beforeEach(t => {
  // Save the current process.env
  t.context.env = Object.assign({}, process.env);
  // Save the current working diretory
  t.context.cwd = process.cwd();
  // Stub the logger functions
  t.context.log = stub();
  t.context.error = stub();
  t.context.logger = {log: t.context.log, error: t.context.error};
  t.context.semanticRelease = proxyquire('../index', {'./lib/logger': t.context.logger});

  t.context.stdout = stub(process.stdout, 'write');
  t.context.stderr = stub(process.stderr, 'write');
});

test.afterEach.always(t => {
  // Restore process.env
  process.env = Object.assign({}, t.context.env);
  // Restore the current working directory
  process.chdir(t.context.cwd);

  t.context.stdout.restore();
  t.context.stderr.restore();
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

  const options = {
    branch: 'master',
    repositoryUrl: 'git@hostname.com:owner/module.git',
    verifyConditions: [verifyConditions1, verifyConditions2],
    getLastRelease,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    publish,
  };

  await t.context.semanticRelease(options);

  t.true(verifyConditions1.calledOnce);
  t.deepEqual(verifyConditions1.firstCall.args[1], {options, logger: t.context.logger});
  t.true(verifyConditions2.calledOnce);
  t.deepEqual(verifyConditions2.firstCall.args[1], {options, logger: t.context.logger});

  t.true(getLastRelease.calledOnce);
  t.deepEqual(getLastRelease.firstCall.args[1], {options, logger: t.context.logger});

  t.true(analyzeCommits.calledOnce);
  t.deepEqual(analyzeCommits.firstCall.args[1].options, options);
  t.deepEqual(analyzeCommits.firstCall.args[1].logger, t.context.logger);
  t.deepEqual(analyzeCommits.firstCall.args[1].lastRelease, lastRelease);
  t.deepEqual(analyzeCommits.firstCall.args[1].commits[0].hash.substring(0, 7), commits[0].hash);
  t.deepEqual(analyzeCommits.firstCall.args[1].commits[0].message, commits[0].message);

  t.true(verifyRelease.calledOnce);
  t.deepEqual(verifyRelease.firstCall.args[1].options, options);
  t.deepEqual(verifyRelease.firstCall.args[1].logger, t.context.logger);
  t.deepEqual(verifyRelease.firstCall.args[1].lastRelease, lastRelease);
  t.deepEqual(verifyRelease.firstCall.args[1].commits[0].hash.substring(0, 7), commits[0].hash);
  t.deepEqual(verifyRelease.firstCall.args[1].commits[0].message, commits[0].message);
  t.deepEqual(verifyRelease.firstCall.args[1].nextRelease, nextRelease);

  t.true(generateNotes.calledOnce);
  t.deepEqual(generateNotes.firstCall.args[1].options, options);
  t.deepEqual(generateNotes.firstCall.args[1].logger, t.context.logger);
  t.deepEqual(generateNotes.firstCall.args[1].lastRelease, lastRelease);
  t.deepEqual(generateNotes.firstCall.args[1].commits[0].hash.substring(0, 7), commits[0].hash);
  t.deepEqual(generateNotes.firstCall.args[1].commits[0].message, commits[0].message);
  t.deepEqual(generateNotes.firstCall.args[1].nextRelease, nextRelease);

  t.true(publish.calledOnce);
  t.deepEqual(publish.firstCall.args[1].options, options);
  t.deepEqual(publish.firstCall.args[1].logger, t.context.logger);
  t.deepEqual(publish.firstCall.args[1].lastRelease, lastRelease);
  t.deepEqual(publish.firstCall.args[1].commits[0].hash.substring(0, 7), commits[0].hash);
  t.deepEqual(publish.firstCall.args[1].commits[0].message, commits[0].message);
  t.deepEqual(publish.firstCall.args[1].nextRelease, Object.assign({}, nextRelease, {notes}));
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

  await t.context.semanticRelease(options);

  t.true(generateNotes.calledTwice);
  t.deepEqual(generateNotes.firstCall.args[1].nextRelease, nextRelease);
  t.true(publish1.calledOnce);
  t.deepEqual(publish1.firstCall.args[1].nextRelease, Object.assign({}, nextRelease, {notes}));

  nextRelease.gitHead = await getGitHead();

  t.deepEqual(generateNotes.secondCall.args[1].nextRelease, Object.assign({}, nextRelease, {notes}));
  t.true(publish2.calledOnce);
  t.deepEqual(publish2.firstCall.args[1].nextRelease, Object.assign({}, nextRelease, {notes}));
});

test.serial('Dry-run skips verifyConditions and publish', async t => {
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

  await t.context.semanticRelease(options);

  t.true(verifyConditions.notCalled);
  t.true(getLastRelease.calledOnce);
  t.true(analyzeCommits.calledOnce);
  t.true(verifyRelease.calledOnce);
  t.true(generateNotes.calledOnce);
  t.true(publish.notCalled);
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

  await t.context.semanticRelease(options);

  t.true(getLastRelease.calledOnce);

  t.true(analyzeCommits.calledOnce);
  t.deepEqual(analyzeCommits.firstCall.args[1].lastRelease, lastRelease);

  t.true(verifyRelease.calledOnce);
  t.deepEqual(verifyRelease.firstCall.args[1].lastRelease, lastRelease);

  t.true(generateNotes.calledOnce);
  t.deepEqual(generateNotes.firstCall.args[1].lastRelease, lastRelease);

  t.true(publish.calledOnce);
  t.deepEqual(publish.firstCall.args[1].lastRelease, lastRelease);
  t.falsy(publish.firstCall.args[1].nextRelease.notes);
});

test.serial('Throw SemanticReleaseError if not running from a git repository', async t => {
  // Set the current working directory to a temp directory
  process.chdir(tempy.directory());

  const error = await t.throws(t.context.semanticRelease());

  // Verify error code and type
  t.is(error.code, 'ENOGITREPO');
  t.is(error.name, 'SemanticReleaseError');
});

test.serial('Throw SemanticReleaseError if repositoryUrl is not set and cannot be found', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();

  const error = await t.throws(t.context.semanticRelease());

  // Verify error code and type
  t.is(error.code, 'ENOREPOURL');
  t.is(error.name, 'SemanticReleaseError');
});

test.serial('Throw an Error if returns an unexpected value', async t => {
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

  const error = await t.throws(t.context.semanticRelease(options), Error);

  // Verify error message
  t.regex(error.message, new RegExp(DEFINITIONS.getLastRelease.output.message));
  t.regex(error.message, /Received: 'string'/);
});

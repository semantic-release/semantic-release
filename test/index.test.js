import test from 'ava';
import proxyquire from 'proxyquire';
import {spy, stub} from 'sinon';
import clearModule from 'clear-module';
import AggregateError from 'aggregate-error';
import SemanticReleaseError from '@semantic-release/error';
import DEFINITIONS from '../lib/definitions/plugins';
import {COMMIT_NAME, COMMIT_EMAIL} from '../lib/definitions/constants';
import {
  gitHead as getGitHead,
  gitTagHead,
  gitRepo,
  gitCommits,
  gitTagVersion,
  gitRemoteTagHead,
  push,
  gitShallowClone,
  reset,
} from './helpers/git-utils';

// Save the current process.env
const envBackup = Object.assign({}, process.env);
// Save the current working diretory
const cwd = process.cwd();
const pluginNoop = require.resolve('./fixtures/plugin-noop');

test.beforeEach(t => {
  clearModule('../lib/hide-sensitive');
  // Delete environment variables that could have been set on the machine running the tests
  delete process.env.GIT_CREDENTIALS;
  delete process.env.GH_TOKEN;
  delete process.env.GITHUB_TOKEN;
  delete process.env.GL_TOKEN;
  delete process.env.GITLAB_TOKEN;
  // Stub the logger functions
  t.context.log = spy();
  t.context.error = spy();
  t.context.logger = {log: t.context.log, error: t.context.error};
  t.context.stdout = stub(process.stdout, 'write');
  t.context.stderr = stub(process.stderr, 'write');
});

test.afterEach.always(t => {
  // Restore process.env
  process.env = envBackup;
  // Restore the current working directory
  process.chdir(cwd);

  t.context.stdout.restore();
  t.context.stderr.restore();
});

test.serial('Plugins are called with expected values', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  // Add commits to the master branch
  let commits = await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  commits = (await gitCommits(['Second'])).concat(commits);
  await push();

  const lastRelease = {version: '1.0.0', gitHead: commits[commits.length - 1].hash, gitTag: 'v1.0.0'};
  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const notes = 'Release notes';
  const verifyConditions1 = stub().resolves();
  const verifyConditions2 = stub().resolves();
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const release1 = {name: 'Release 1', url: 'https://release1.com'};
  const prepare = stub().resolves();
  const publish1 = stub().resolves(release1);
  const success = stub().resolves();

  const config = {branch: 'master', repositoryUrl, globalOpt: 'global', tagFormat: `v\${version}`};
  const options = {
    ...config,
    verifyConditions: [verifyConditions1, verifyConditions2],
    analyzeCommits,
    verifyRelease,
    generateNotes,
    prepare,
    publish: [publish1, pluginNoop],
    success,
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

  t.is(analyzeCommits.callCount, 1);
  t.deepEqual(analyzeCommits.args[0][0], config);
  t.deepEqual(analyzeCommits.args[0][1].options, options);
  t.deepEqual(analyzeCommits.args[0][1].logger, t.context.logger);
  t.deepEqual(analyzeCommits.args[0][1].lastRelease, lastRelease);
  t.deepEqual(analyzeCommits.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(analyzeCommits.args[0][1].commits[0].message, commits[0].message);

  t.is(verifyRelease.callCount, 1);
  t.deepEqual(verifyRelease.args[0][0], config);
  t.deepEqual(verifyRelease.args[0][1].options, options);
  t.deepEqual(verifyRelease.args[0][1].logger, t.context.logger);
  t.deepEqual(verifyRelease.args[0][1].lastRelease, lastRelease);
  t.deepEqual(verifyRelease.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(verifyRelease.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(verifyRelease.args[0][1].nextRelease, nextRelease);

  t.is(generateNotes.callCount, 1);
  t.deepEqual(generateNotes.args[0][0], config);
  t.deepEqual(generateNotes.args[0][1].options, options);
  t.deepEqual(generateNotes.args[0][1].logger, t.context.logger);
  t.deepEqual(generateNotes.args[0][1].lastRelease, lastRelease);
  t.deepEqual(generateNotes.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(generateNotes.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(generateNotes.args[0][1].nextRelease, nextRelease);

  t.is(prepare.callCount, 1);
  t.deepEqual(prepare.args[0][0], config);
  t.deepEqual(prepare.args[0][1].options, options);
  t.deepEqual(prepare.args[0][1].logger, t.context.logger);
  t.deepEqual(prepare.args[0][1].lastRelease, lastRelease);
  t.deepEqual(prepare.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(prepare.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(prepare.args[0][1].nextRelease, {...nextRelease, ...{notes}});

  t.is(publish1.callCount, 1);
  t.deepEqual(publish1.args[0][0], config);
  t.deepEqual(publish1.args[0][1].options, options);
  t.deepEqual(publish1.args[0][1].logger, t.context.logger);
  t.deepEqual(publish1.args[0][1].lastRelease, lastRelease);
  t.deepEqual(publish1.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(publish1.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(publish1.args[0][1].nextRelease, {...nextRelease, ...{notes}});

  t.is(success.callCount, 1);
  t.deepEqual(success.args[0][0], config);
  t.deepEqual(success.args[0][1].options, options);
  t.deepEqual(success.args[0][1].logger, t.context.logger);
  t.deepEqual(success.args[0][1].lastRelease, lastRelease);
  t.deepEqual(success.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(success.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(success.args[0][1].nextRelease, {...nextRelease, ...{notes}});
  t.deepEqual(success.args[0][1].releases, [
    {...release1, ...nextRelease, ...{notes}, ...{pluginName: '[Function: proxy]'}},
    {...nextRelease, ...{notes}, ...{pluginName: pluginNoop}},
  ]);

  // Verify the tag has been created on the local and remote repo and reference the gitHead
  t.is(await gitTagHead(nextRelease.gitTag), nextRelease.gitHead);
  t.is(await gitRemoteTagHead(repositoryUrl, nextRelease.gitTag), nextRelease.gitHead);

  // Verify the author/commiter name and email hve been set
  t.is(process.env.GIT_AUTHOR_NAME, COMMIT_NAME);
  t.is(process.env.GIT_AUTHOR_EMAIL, COMMIT_EMAIL);
  t.is(process.env.GIT_COMMITTER_NAME, COMMIT_NAME);
  t.is(process.env.GIT_COMMITTER_EMAIL, COMMIT_EMAIL);
});

test.serial('Use custom tag format', async t => {
  const repositoryUrl = await gitRepo(true);
  await gitCommits(['First']);
  await gitTagVersion('test-1.0.0');
  await gitCommits(['Second']);
  await push();

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'test-2.0.0'};
  const notes = 'Release notes';
  const config = {branch: 'master', repositoryUrl, globalOpt: 'global', tagFormat: `test-\${version}`};
  const options = {
    ...config,
    verifyConditions: stub().resolves(),
    analyzeCommits: stub().resolves(nextRelease.type),
    verifyRelease: stub().resolves(),
    generateNotes: stub().resolves(notes),
    prepare: stub().resolves(),
    publish: stub().resolves(),
    success: stub().resolves(),
    fail: stub().resolves(),
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(await semanticRelease(options));

  // Verify the tag has been created on the local and remote repo and reference the gitHead
  t.is(await gitTagHead(nextRelease.gitTag), nextRelease.gitHead);
  t.is(await gitRemoteTagHead(repositoryUrl, nextRelease.gitTag), nextRelease.gitHead);
});

test.serial('Use new gitHead, and recreate release notes if a prepare plugin create a commit', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  // Add commits to the master branch
  let commits = await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  commits = (await gitCommits(['Second'])).concat(commits);
  await push();

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const notes = 'Release notes';

  const generateNotes = stub().resolves(notes);
  const prepare1 = stub().callsFake(async () => {
    commits = (await gitCommits(['Third'])).concat(commits);
  });
  const prepare2 = stub().resolves();
  const publish = stub().resolves();

  const options = {
    branch: 'master',
    repositoryUrl,
    verifyConditions: stub().resolves(),
    analyzeCommits: stub().resolves(nextRelease.type),
    verifyRelease: stub().resolves(),
    generateNotes,
    prepare: [prepare1, prepare2],
    publish,
    success: stub().resolves(),
    fail: stub().resolves(),
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  t.truthy(await semanticRelease(options));

  t.is(generateNotes.callCount, 2);
  t.deepEqual(generateNotes.args[0][1].nextRelease, nextRelease);
  t.is(prepare1.callCount, 1);
  t.deepEqual(prepare1.args[0][1].nextRelease, {...nextRelease, ...{notes}});

  nextRelease.gitHead = await getGitHead();

  t.deepEqual(generateNotes.args[1][1].nextRelease, {...nextRelease, ...{notes}});
  t.is(prepare2.callCount, 1);
  t.deepEqual(prepare2.args[0][1].nextRelease, {...nextRelease, ...{notes}});

  t.is(publish.callCount, 1);
  t.deepEqual(publish.args[0][1].nextRelease, {...nextRelease, ...{notes}});

  // Verify the tag has been created on the local and remote repo and reference the last gitHead
  t.is(await gitTagHead(nextRelease.gitTag), commits[0].hash);
  t.is(await gitRemoteTagHead(repositoryUrl, nextRelease.gitTag), commits[0].hash);
});

test.serial('Call all "success" plugins even if one errors out', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  await gitCommits(['Second']);
  await push();

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const notes = 'Release notes';
  const verifyConditions1 = stub().resolves();
  const verifyConditions2 = stub().resolves();
  const analyzeCommits = stub().resolves(nextRelease.type);
  const generateNotes = stub().resolves(notes);
  const release = {name: 'Release', url: 'https://release.com'};
  const publish = stub().resolves(release);
  const success1 = stub().rejects();
  const success2 = stub().resolves();

  const config = {branch: 'master', repositoryUrl, globalOpt: 'global', tagFormat: `v\${version}`};
  const options = {
    ...config,
    verifyConditions: [verifyConditions1, verifyConditions2],
    analyzeCommits,
    generateNotes,
    prepare: stub().resolves(),
    publish,
    success: [success1, success2],
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  await t.throws(semanticRelease(options));

  t.is(success1.callCount, 1);
  t.deepEqual(success1.args[0][0], config);
  t.deepEqual(success1.args[0][1].releases, [
    {...release, ...nextRelease, ...{notes}, ...{pluginName: '[Function: proxy]'}},
  ]);

  t.is(success2.callCount, 1);
  t.deepEqual(success2.args[0][1].releases, [
    {...release, ...nextRelease, ...{notes}, ...{pluginName: '[Function: proxy]'}},
  ]);
});

test.serial('Log all "verifyConditions" errors', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First']);
  await push();

  const error1 = new Error('error 1');
  const error2 = new SemanticReleaseError('error 2', 'ERR2');
  const error3 = new SemanticReleaseError('error 3', 'ERR3');
  const fail = stub().resolves();
  const config = {branch: 'master', repositoryUrl, tagFormat: `v\${version}`};
  const options = {
    ...config,
    verifyConditions: [stub().rejects(new AggregateError([error1, error2])), stub().rejects(error3)],
    fail,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const errors = [...(await t.throws(semanticRelease(options)))];

  t.deepEqual(errors, [error1, error2, error3]);
  t.deepEqual(t.context.log.args[t.context.log.args.length - 2], ['%s error 2', 'ERR2']);
  t.deepEqual(t.context.log.args[t.context.log.args.length - 1], ['%s error 3', 'ERR3']);
  t.deepEqual(t.context.error.args[t.context.error.args.length - 1], [
    'An error occurred while running semantic-release: %O',
    error1,
  ]);
  t.true(t.context.error.calledAfter(t.context.log));
  t.is(fail.callCount, 1);
  t.deepEqual(fail.args[0][0], config);
  t.deepEqual(fail.args[0][1].options, options);
  t.deepEqual(fail.args[0][1].logger, t.context.logger);
  t.deepEqual(fail.args[0][1].errors, [error2, error3]);
});

test.serial('Log all "verifyRelease" errors', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  await gitCommits(['Second']);
  await push();

  const error1 = new SemanticReleaseError('error 1', 'ERR1');
  const error2 = new SemanticReleaseError('error 2', 'ERR2');
  const fail = stub().resolves();
  const config = {branch: 'master', repositoryUrl, tagFormat: `v\${version}`};
  const options = {
    ...config,
    verifyConditions: stub().resolves(),
    analyzeCommits: stub().resolves('major'),
    verifyRelease: [stub().rejects(error1), stub().rejects(error2)],
    fail,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const errors = [...(await t.throws(semanticRelease(options)))];

  t.deepEqual(errors, [error1, error2]);
  t.deepEqual(t.context.log.args[t.context.log.args.length - 2], ['%s error 1', 'ERR1']);
  t.deepEqual(t.context.log.args[t.context.log.args.length - 1], ['%s error 2', 'ERR2']);
  t.is(fail.callCount, 1);
  t.deepEqual(fail.args[0][0], config);
  t.deepEqual(fail.args[0][1].errors, [error1, error2]);
});

test.serial('Dry-run skips publish and success', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  await gitCommits(['Second']);
  await push();

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const notes = 'Release notes';

  const verifyConditions = stub().resolves();
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const publish = stub().resolves();
  const success = stub().resolves();

  const options = {
    dryRun: true,
    branch: 'master',
    repositoryUrl,
    verifyConditions,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    prepare: stub().resolves(),
    publish,
    success,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(await semanticRelease(options));

  t.not(t.context.log.args[0][0], 'This run was not triggered in a known CI environment, running in dry-run mode.');
  t.is(verifyConditions.callCount, 1);
  t.is(analyzeCommits.callCount, 1);
  t.is(verifyRelease.callCount, 1);
  t.is(generateNotes.callCount, 1);
  t.is(publish.callCount, 0);
  t.is(success.callCount, 0);
});

test.serial('Dry-run skips fail', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  await gitCommits(['Second']);
  await push();

  const error1 = new SemanticReleaseError('error 1', 'ERR1');
  const error2 = new SemanticReleaseError('error 2', 'ERR2');
  const fail = stub().resolves();

  const options = {
    dryRun: true,
    branch: 'master',
    repositoryUrl,
    verifyConditions: [stub().rejects(error1), stub().rejects(error2)],
    fail,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const errors = [...(await t.throws(semanticRelease(options)))];

  t.deepEqual(errors, [error1, error2]);
  t.deepEqual(t.context.log.args[t.context.log.args.length - 2], ['%s error 1', 'ERR1']);
  t.deepEqual(t.context.log.args[t.context.log.args.length - 1], ['%s error 2', 'ERR2']);
  t.is(fail.callCount, 0);
});

test.serial('Force a dry-run if not on a CI and "noCi" is not explicitly set', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  await gitCommits(['Second']);
  await push();

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const notes = 'Release notes';

  const verifyConditions = stub().resolves();
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const publish = stub().resolves();
  const success = stub().resolves();

  const options = {
    dryRun: false,
    branch: 'master',
    repositoryUrl,
    verifyConditions,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    prepare: stub().resolves(),
    publish,
    success,
    fail: stub().resolves(),
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: false, branch: 'master'}),
  });
  t.truthy(await semanticRelease(options));

  t.is(t.context.log.args[1][0], 'This run was not triggered in a known CI environment, running in dry-run mode.');
  t.is(verifyConditions.callCount, 1);
  t.is(analyzeCommits.callCount, 1);
  t.is(verifyRelease.callCount, 1);
  t.is(generateNotes.callCount, 1);
  t.is(publish.callCount, 0);
  t.is(success.callCount, 0);
});

test.serial('Allow local releases with "noCi" option', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  await gitCommits(['Second']);
  await push();

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const notes = 'Release notes';

  const verifyConditions = stub().resolves();
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const publish = stub().resolves();
  const success = stub().resolves();

  const options = {
    noCi: true,
    branch: 'master',
    repositoryUrl,
    verifyConditions,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    prepare: stub().resolves(),
    publish,
    success,
    fail: stub().resolves(),
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
  t.is(analyzeCommits.callCount, 1);
  t.is(verifyRelease.callCount, 1);
  t.is(generateNotes.callCount, 1);
  t.is(publish.callCount, 1);
  t.is(success.callCount, 1);
});

test.serial('Accept "undefined" value returned by the "generateNotes" plugins', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  // Add commits to the master branch
  let commits = await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  commits = (await gitCommits(['Second'])).concat(commits);
  await push();

  const lastRelease = {version: '1.0.0', gitHead: commits[commits.length - 1].hash, gitTag: 'v1.0.0'};
  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves();
  const publish = stub().resolves();

  const options = {
    branch: 'master',
    repositoryUrl,
    verifyConditions: stub().resolves(),
    analyzeCommits,
    verifyRelease,
    generateNotes,
    prepare: stub().resolves(),
    publish,
    success: stub().resolves(),
    fail: stub().resolves(),
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(await semanticRelease(options));

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

test.serial('Returns falsy value if triggered by a PR', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: true}),
  });

  t.falsy(await semanticRelease({repositoryUrl}));
  t.is(
    t.context.log.args[t.context.log.args.length - 1][0],
    "This run was triggered by a pull request and therefore a new version won't be published."
  );
});

test.serial('Returns falsy value if triggered on an outdated clone', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First']);
  await gitCommits(['Second']);
  await push();
  await reset();

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  t.falsy(await semanticRelease({repositoryUrl}));
  t.deepEqual(t.context.log.args[t.context.log.args.length - 1], [
    "The local branch %s is behind the remote one, therefore a new version won't be published.",
    'master',
  ]);
});

test.serial('Returns falsy value if not running from the configured branch', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  const options = {
    branch: 'master',
    repositoryUrl,
    verifyConditions: stub().resolves(),
    analyzeCommits: stub().resolves(),
    verifyRelease: stub().resolves(),
    generateNotes: stub().resolves(),
    prepare: stub().resolves(),
    publish: stub().resolves(),
    success: stub().resolves(),
    fail: stub().resolves(),
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'other-branch', isPr: false}),
  });

  t.falsy(await semanticRelease(options));
  t.is(
    t.context.log.args[1][0],
    'This test run was triggered on the branch other-branch, while semantic-release is configured to only publish from master, therefore a new version won’t be published.'
  );
});

test.serial('Returns falsy value if there is no relevant changes', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First']);
  await push();

  const analyzeCommits = stub().resolves();
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves();
  const publish = stub().resolves();

  const options = {
    branch: 'master',
    repositoryUrl,
    verifyConditions: [stub().resolves()],
    analyzeCommits,
    verifyRelease,
    generateNotes,
    prepare: stub().resolves(),
    publish,
    success: stub().resolves(),
    fail: stub().resolves(),
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
  t.is(
    t.context.log.args[t.context.log.args.length - 1][0],
    'There are no relevant changes, so no new version is released.'
  );
});

test.serial('Exclude commits with [skip release] or [release skip] from analysis', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
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
  await push();
  const analyzeCommits = stub().resolves();
  const config = {branch: 'master', repositoryUrl, globalOpt: 'global'};
  const options = {
    ...config,
    verifyConditions: [stub().resolves(), stub().resolves()],
    analyzeCommits,
    verifyRelease: stub().resolves(),
    generateNotes: stub().resolves(),
    prepare: stub().resolves(),
    publish: stub().resolves(),
    success: stub().resolves(),
    fail: stub().resolves(),
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  await semanticRelease(options);

  t.is(analyzeCommits.callCount, 1);

  t.is(analyzeCommits.args[0][1].commits.length, 2);
  t.deepEqual(analyzeCommits.args[0][1].commits[0], commits[commits.length - 1]);
});

test.serial('Hide sensitive environment variable values from the logs', async t => {
  process.env.MY_TOKEN = 'secret token';
  const repositoryUrl = await gitRepo(true);

  const options = {
    branch: 'master',
    repositoryUrl,
    verifyConditions: async (pluginConfig, {logger}) => {
      console.log(`Console: The token ${process.env.MY_TOKEN} is invalid`);
      logger.log(`Log: The token ${process.env.MY_TOKEN} is invalid`);
      logger.error(`Error: The token ${process.env.MY_TOKEN} is invalid`);
      throw new Error(`Invalid token ${process.env.MY_TOKEN}`);
    },
  };
  const semanticRelease = proxyquire('..', {
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  await t.throws(semanticRelease(options));

  t.regex(t.context.stdout.args[t.context.stdout.args.length - 2][0], /Console: The token \[secure\] is invalid/);
  t.regex(t.context.stdout.args[t.context.stdout.args.length - 1][0], /Log: The token \[secure\] is invalid/);
  t.regex(t.context.stderr.args[0][0], /Error: The token \[secure\] is invalid/);
  t.regex(t.context.stderr.args[1][0], /Invalid token \[secure\]/);
});

test.serial('Log both plugins errors and errors thrown by "fail" plugin', async t => {
  process.env.MY_TOKEN = 'secret token';
  const repositoryUrl = await gitRepo(true);
  const pluginError = new SemanticReleaseError('Plugin error', 'ERR');
  const failError1 = new Error('Fail error 1');
  const failError2 = new Error('Fail error 2');

  const options = {
    branch: 'master',
    repositoryUrl,
    verifyConditions: stub().rejects(pluginError),
    fail: [stub().rejects(failError1), stub().rejects(failError2)],
  };
  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  await t.throws(semanticRelease(options));

  t.is(t.context.error.args[t.context.error.args.length - 2][1], failError1);
  t.is(t.context.error.args[t.context.error.args.length - 1][1], failError2);
  t.deepEqual(t.context.log.args[t.context.log.args.length - 1], ['%s Plugin error', 'ERR']);
});

test.serial('Call "fail" only if a plugin returns a SemanticReleaseError', async t => {
  process.env.MY_TOKEN = 'secret token';
  const repositoryUrl = await gitRepo(true);
  const pluginError = new Error('Plugin error');
  const fail = stub().resolves();

  const options = {
    branch: 'master',
    repositoryUrl,
    verifyConditions: stub().rejects(pluginError),
    fail,
  };
  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  await t.throws(semanticRelease(options));

  t.true(fail.notCalled);
  t.is(t.context.error.args[t.context.error.args.length - 1][1], pluginError);
});

test.serial('Throw SemanticReleaseError if repositoryUrl is not set and cannot be found from repo config', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const errors = [...(await t.throws(semanticRelease()))];

  // Verify error code and type
  t.is(errors[0].code, 'ENOREPOURL');
  t.is(errors[0].name, 'SemanticReleaseError');
});

test.serial('Throw an Error if plugin returns an unexpected value', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repositoryUrl = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First']);
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0');
  // Add new commits to the master branch
  await gitCommits(['Second']);
  await push();

  const verifyConditions = stub().resolves();
  const analyzeCommits = stub().resolves('string');

  const options = {
    branch: 'master',
    repositoryUrl,
    verifyConditions: [verifyConditions],
    analyzeCommits,
    success: stub().resolves(),
    fail: stub().resolves(),
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const error = await t.throws(semanticRelease(options), Error);

  // Verify error message
  t.regex(error.message, new RegExp(DEFINITIONS.analyzeCommits.output.message));
  t.regex(error.details, /string/);
});

test.serial('Get all commits including the ones not in the shallow clone', async t => {
  const repositoryUrl = await gitRepo(true);
  await gitTagVersion('v1.0.0');
  await gitCommits(['First', 'Second', 'Third']);
  await push(repositoryUrl, 'master');

  await gitShallowClone(repositoryUrl);

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead(), gitTag: 'v2.0.0'};
  const notes = 'Release notes';
  const analyzeCommits = stub().resolves(nextRelease.type);

  const config = {branch: 'master', repositoryUrl, globalOpt: 'global'};
  const options = {
    ...config,
    verifyConditions: stub().resolves(),
    analyzeCommits,
    verifyRelease: stub().resolves(),
    generateNotes: stub().resolves(notes),
    prepare: stub().resolves(),
    publish: stub().resolves(),
    success: stub().resolves(),
    fail: stub().resolves(),
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(await semanticRelease(options));

  t.is(analyzeCommits.args[0][1].commits.length, 3);
});

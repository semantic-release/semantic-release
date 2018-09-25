import test from 'ava';
import {escapeRegExp, isString} from 'lodash';
import proxyquire from 'proxyquire';
import {spy, stub} from 'sinon';
import {WritableStreamBuffer} from 'stream-buffers';
import AggregateError from 'aggregate-error';
import SemanticReleaseError from '@semantic-release/error';
import {COMMIT_NAME, COMMIT_EMAIL, SECRET_REPLACEMENT} from '../lib/definitions/constants';
import {
  gitHead as getGitHead,
  gitTagHead,
  gitRepo,
  gitCommits,
  gitTagVersion,
  gitRemoteTagHead,
  gitPush,
  gitShallowClone,
} from './helpers/git-utils';

const requireNoCache = proxyquire.noPreserveCache();
const pluginNoop = require.resolve('./fixtures/plugin-noop');

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = spy();
  t.context.error = spy();
  t.context.success = spy();
  t.context.logger = {
    log: t.context.log,
    error: t.context.error,
    success: t.context.success,
    scope: () => t.context.logger,
  };
});

test('Plugins are called with expected values', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  let commits = await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  commits = (await gitCommits(['Second'], {cwd})).concat(commits);
  await gitPush(repositoryUrl, 'master', {cwd});

  const lastRelease = {version: '1.0.0', gitHead: commits[commits.length - 1].hash, gitTag: 'v1.0.0'};
  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead({cwd}), gitTag: 'v2.0.0'};
  const notes1 = 'Release notes 1';
  const notes2 = 'Release notes 2';
  const notes3 = 'Release notes 3';
  const verifyConditions1 = stub().resolves();
  const verifyConditions2 = stub().resolves();
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes1 = stub().resolves(notes1);
  const generateNotes2 = stub().resolves(notes2);
  const generateNotes3 = stub().resolves(notes3);
  const release1 = {name: 'Release 1', url: 'https://release1.com'};
  const prepare = stub().resolves();
  const publish1 = stub().resolves(release1);
  const success = stub().resolves();
  const env = {...process.env};
  const config = {branch: 'master', repositoryUrl, globalOpt: 'global', tagFormat: `v\${version}`};
  const options = {
    ...config,
    plugins: false,
    verifyConditions: [verifyConditions1, verifyConditions2],
    analyzeCommits,
    verifyRelease,
    generateNotes: [generateNotes1, generateNotes2, generateNotes3],
    prepare,
    publish: [publish1, pluginNoop],
    success,
  };

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const result = await semanticRelease(options, {
    cwd,
    env,
    stdout: new WritableStreamBuffer(),
    stderr: new WritableStreamBuffer(),
  });

  t.is(verifyConditions1.callCount, 1);
  t.deepEqual(verifyConditions1.args[0][0], config);
  t.deepEqual(verifyConditions1.args[0][1].cwd, cwd);
  t.deepEqual(verifyConditions1.args[0][1].options, options);
  t.deepEqual(verifyConditions1.args[0][1].logger, t.context.logger);
  t.is(verifyConditions2.callCount, 1);
  t.deepEqual(verifyConditions2.args[0][0], config);
  t.deepEqual(verifyConditions2.args[0][1].cwd, cwd);
  t.deepEqual(verifyConditions2.args[0][1].options, options);
  t.deepEqual(verifyConditions2.args[0][1].logger, t.context.logger);

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

  t.is(generateNotes1.callCount, 1);
  t.deepEqual(generateNotes1.args[0][0], config);
  t.deepEqual(generateNotes1.args[0][1].options, options);
  t.deepEqual(generateNotes1.args[0][1].logger, t.context.logger);
  t.deepEqual(generateNotes1.args[0][1].lastRelease, lastRelease);
  t.deepEqual(generateNotes1.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(generateNotes1.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(generateNotes1.args[0][1].nextRelease, nextRelease);

  t.is(generateNotes2.callCount, 1);
  t.deepEqual(generateNotes2.args[0][0], config);
  t.deepEqual(generateNotes2.args[0][1].options, options);
  t.deepEqual(generateNotes2.args[0][1].logger, t.context.logger);
  t.deepEqual(generateNotes2.args[0][1].lastRelease, lastRelease);
  t.deepEqual(generateNotes2.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(generateNotes2.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(generateNotes2.args[0][1].nextRelease, {...nextRelease, notes: notes1});

  t.is(generateNotes3.callCount, 1);
  t.deepEqual(generateNotes3.args[0][0], config);
  t.deepEqual(generateNotes3.args[0][1].options, options);
  t.deepEqual(generateNotes3.args[0][1].logger, t.context.logger);
  t.deepEqual(generateNotes3.args[0][1].lastRelease, lastRelease);
  t.deepEqual(generateNotes3.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(generateNotes3.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(generateNotes3.args[0][1].nextRelease, {...nextRelease, notes: `${notes1}\n\n${notes2}`});

  t.is(prepare.callCount, 1);
  t.deepEqual(prepare.args[0][0], config);
  t.deepEqual(prepare.args[0][1].options, options);
  t.deepEqual(prepare.args[0][1].logger, t.context.logger);
  t.deepEqual(prepare.args[0][1].lastRelease, lastRelease);
  t.deepEqual(prepare.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(prepare.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(prepare.args[0][1].nextRelease, {...nextRelease, notes: `${notes1}\n\n${notes2}\n\n${notes3}`});

  t.is(publish1.callCount, 1);
  t.deepEqual(publish1.args[0][0], config);
  t.deepEqual(publish1.args[0][1].options, options);
  t.deepEqual(publish1.args[0][1].logger, t.context.logger);
  t.deepEqual(publish1.args[0][1].lastRelease, lastRelease);
  t.deepEqual(publish1.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(publish1.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(publish1.args[0][1].nextRelease, {...nextRelease, notes: `${notes1}\n\n${notes2}\n\n${notes3}`});

  t.is(success.callCount, 1);
  t.deepEqual(success.args[0][0], config);
  t.deepEqual(success.args[0][1].options, options);
  t.deepEqual(success.args[0][1].logger, t.context.logger);
  t.deepEqual(success.args[0][1].lastRelease, lastRelease);
  t.deepEqual(success.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(success.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(success.args[0][1].nextRelease, {...nextRelease, notes: `${notes1}\n\n${notes2}\n\n${notes3}`});
  t.deepEqual(success.args[0][1].releases, [
    {...release1, ...nextRelease, notes: `${notes1}\n\n${notes2}\n\n${notes3}`, pluginName: '[Function: proxy]'},
    {...nextRelease, notes: `${notes1}\n\n${notes2}\n\n${notes3}`, pluginName: pluginNoop},
  ]);

  t.deepEqual(result, {
    lastRelease,
    commits: [commits[0]],
    nextRelease: {...nextRelease, notes: `${notes1}\n\n${notes2}\n\n${notes3}`},
    releases: [
      {...release1, ...nextRelease, notes: `${notes1}\n\n${notes2}\n\n${notes3}`, pluginName: '[Function: proxy]'},
      {...nextRelease, notes: `${notes1}\n\n${notes2}\n\n${notes3}`, pluginName: pluginNoop},
    ],
  });

  // Verify the tag has been created on the local and remote repo and reference the gitHead
  t.is(await gitTagHead(nextRelease.gitTag, {cwd}), nextRelease.gitHead);
  t.is(await gitRemoteTagHead(repositoryUrl, nextRelease.gitTag, {cwd}), nextRelease.gitHead);

  // Verify the author/commiter name and email have been set
  t.is(env.GIT_AUTHOR_NAME, COMMIT_NAME);
  t.is(env.GIT_AUTHOR_EMAIL, COMMIT_EMAIL);
  t.is(env.GIT_COMMITTER_NAME, COMMIT_NAME);
  t.is(env.GIT_COMMITTER_EMAIL, COMMIT_EMAIL);
});

test('Use custom tag format', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['First'], {cwd});
  await gitTagVersion('test-1.0.0', undefined, {cwd});
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead({cwd}), gitTag: 'test-2.0.0'};
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

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(
    await semanticRelease(options, {
      cwd,
      env: {},
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    })
  );

  // Verify the tag has been created on the local and remote repo and reference the gitHead
  t.is(await gitTagHead(nextRelease.gitTag, {cwd}), nextRelease.gitHead);
  t.is(await gitRemoteTagHead(repositoryUrl, nextRelease.gitTag, {cwd}), nextRelease.gitHead);
});

test('Use new gitHead, and recreate release notes if a prepare plugin create a commit', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  let commits = await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  commits = (await gitCommits(['Second'], {cwd})).concat(commits);
  await gitPush(repositoryUrl, 'master', {cwd});

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead({cwd}), gitTag: 'v2.0.0'};
  const notes = 'Release notes';

  const generateNotes = stub().resolves(notes);
  const prepare1 = stub().callsFake(async () => {
    commits = (await gitCommits(['Third'], {cwd})).concat(commits);
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

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  t.truthy(
    await semanticRelease(options, {
      cwd,
      env: {},
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    })
  );

  t.is(generateNotes.callCount, 2);
  t.deepEqual(generateNotes.args[0][1].nextRelease, nextRelease);
  t.is(prepare1.callCount, 1);
  t.deepEqual(prepare1.args[0][1].nextRelease, {...nextRelease, notes});

  nextRelease.gitHead = await getGitHead({cwd});

  t.deepEqual(generateNotes.args[1][1].nextRelease, {...nextRelease, notes});
  t.is(prepare2.callCount, 1);
  t.deepEqual(prepare2.args[0][1].nextRelease, {...nextRelease, notes});

  t.is(publish.callCount, 1);
  t.deepEqual(publish.args[0][1].nextRelease, {...nextRelease, notes});

  // Verify the tag has been created on the local and remote repo and reference the last gitHead
  t.is(await gitTagHead(nextRelease.gitTag, {cwd}), commits[0].hash);
  t.is(await gitRemoteTagHead(repositoryUrl, nextRelease.gitTag, {cwd}), commits[0].hash);
});

test('Call all "success" plugins even if one errors out', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead({cwd}), gitTag: 'v2.0.0'};
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

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  await t.throws(
    semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
  );

  t.is(success1.callCount, 1);
  t.deepEqual(success1.args[0][1].releases, [{...release, ...nextRelease, notes, pluginName: '[Function: proxy]'}]);

  t.is(success2.callCount, 1);
  t.deepEqual(success2.args[0][1].releases, [{...release, ...nextRelease, notes, pluginName: '[Function: proxy]'}]);
});

test('Log all "verifyConditions" errors', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const error1 = new Error('error 1');
  const error2 = new SemanticReleaseError('error 2', 'ERR2');
  const error3 = new SemanticReleaseError('error 3', 'ERR3');
  const fail = stub().resolves();
  const config = {branch: 'master', repositoryUrl, tagFormat: `v\${version}`};
  const options = {
    ...config,
    plugins: false,
    verifyConditions: [stub().rejects(new AggregateError([error1, error2])), stub().rejects(error3)],
    fail,
  };

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const errors = [
    ...(await t.throws(
      semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
    )),
  ];

  t.deepEqual(errors, [error1, error2, error3]);
  t.deepEqual(t.context.error.args[t.context.error.args.length - 2], ['ERR2 error 2']);
  t.deepEqual(t.context.error.args[t.context.error.args.length - 1], ['ERR3 error 3']);
  t.deepEqual(t.context.error.args[t.context.error.args.length - 3], [
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

test('Log all "verifyRelease" errors', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

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

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const errors = [
    ...(await t.throws(
      semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
    )),
  ];

  t.deepEqual(errors, [error1, error2]);
  t.deepEqual(t.context.error.args[t.context.error.args.length - 2], ['ERR1 error 1']);
  t.deepEqual(t.context.error.args[t.context.error.args.length - 1], ['ERR2 error 2']);
  t.is(fail.callCount, 1);
  t.deepEqual(fail.args[0][0], config);
  t.deepEqual(fail.args[0][1].errors, [error1, error2]);
});

test('Dry-run skips publish and success', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead({cwd}), gitTag: 'v2.0.0'};
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

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(
    await semanticRelease(options, {
      cwd,
      env: {},
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    })
  );

  t.not(t.context.log.args[0][0], 'This run was not triggered in a known CI environment, running in dry-run mode.');
  t.is(verifyConditions.callCount, 1);
  t.is(analyzeCommits.callCount, 1);
  t.is(verifyRelease.callCount, 1);
  t.is(generateNotes.callCount, 1);
  t.is(publish.callCount, 0);
  t.is(success.callCount, 0);
});

test('Dry-run skips fail', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

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

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const errors = [
    ...(await t.throws(
      semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
    )),
  ];

  t.deepEqual(errors, [error1, error2]);
  t.deepEqual(t.context.error.args[t.context.error.args.length - 2], ['ERR1 error 1']);
  t.deepEqual(t.context.error.args[t.context.error.args.length - 1], ['ERR2 error 2']);
  t.is(fail.callCount, 0);
});

test('Force a dry-run if not on a CI and "noCi" is not explicitly set', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead({cwd}), gitTag: 'v2.0.0'};
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

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: false, branch: 'master'}),
  });
  t.truthy(
    await semanticRelease(options, {
      cwd,
      env: {},
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    })
  );

  t.is(t.context.log.args[1][0], 'This run was not triggered in a known CI environment, running in dry-run mode.');
  t.is(verifyConditions.callCount, 1);
  t.is(analyzeCommits.callCount, 1);
  t.is(verifyRelease.callCount, 1);
  t.is(generateNotes.callCount, 1);
  t.is(publish.callCount, 0);
  t.is(success.callCount, 0);
});

test('Dry-run does not print changelog if "generateNotes" return "undefined"', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead({cwd}), gitTag: 'v2.0.0'};
  const analyzeCommits = stub().resolves(nextRelease.type);
  const generateNotes = stub().resolves();

  const options = {
    dryRun: true,
    branch: 'master',
    repositoryUrl,
    verifyConditions: false,
    analyzeCommits,
    verifyRelease: false,
    generateNotes,
    prepare: false,
    publish: false,
    success: false,
  };

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(
    await semanticRelease(options, {
      cwd,
      env: {},
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    })
  );

  t.deepEqual(t.context.log.args[t.context.log.args.length - 1], ['Release note for version 2.0.0:']);
});

test('Allow local releases with "noCi" option', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead({cwd}), gitTag: 'v2.0.0'};
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

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: false, branch: 'master', isPr: true}),
  });
  t.truthy(
    await semanticRelease(options, {
      cwd,
      env: {},
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    })
  );

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

test('Accept "undefined" value returned by the "generateNotes" plugins', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  let commits = await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  commits = (await gitCommits(['Second'], {cwd})).concat(commits);
  await gitPush(repositoryUrl, 'master', {cwd});

  const lastRelease = {version: '1.0.0', gitHead: commits[commits.length - 1].hash, gitTag: 'v1.0.0'};
  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead({cwd}), gitTag: 'v2.0.0'};
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes1 = stub().resolves();
  const notes2 = 'Release notes 2';
  const generateNotes2 = stub().resolves(notes2);
  const publish = stub().resolves();

  const options = {
    branch: 'master',
    repositoryUrl,
    verifyConditions: stub().resolves(),
    analyzeCommits,
    verifyRelease,
    generateNotes: [generateNotes1, generateNotes2],
    prepare: stub().resolves(),
    publish,
    success: stub().resolves(),
    fail: stub().resolves(),
  };

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(
    await semanticRelease(options, {
      cwd,
      env: {},
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    })
  );

  t.is(analyzeCommits.callCount, 1);
  t.deepEqual(analyzeCommits.args[0][1].lastRelease, lastRelease);

  t.is(verifyRelease.callCount, 1);
  t.deepEqual(verifyRelease.args[0][1].lastRelease, lastRelease);

  t.is(generateNotes1.callCount, 1);
  t.deepEqual(generateNotes1.args[0][1].lastRelease, lastRelease);

  t.is(generateNotes2.callCount, 1);
  t.deepEqual(generateNotes2.args[0][1].lastRelease, lastRelease);

  t.is(publish.callCount, 1);
  t.deepEqual(publish.args[0][1].lastRelease, lastRelease);
  t.is(publish.args[0][1].nextRelease.notes, notes2);
});

test('Returns false if triggered by a PR', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: true}),
  });

  t.false(
    await semanticRelease(
      {cwd, repositoryUrl},
      {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()}
    )
  );
  t.is(
    t.context.log.args[t.context.log.args.length - 1][0],
    "This run was triggered by a pull request and therefore a new version won't be published."
  );
});

test('Returns false if triggered on an outdated clone', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  let {cwd, repositoryUrl} = await gitRepo(true);
  const repoDir = cwd;
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  cwd = await gitShallowClone(repositoryUrl);
  await gitCommits(['Third'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  t.false(
    await semanticRelease(
      {repositoryUrl},
      {cwd: repoDir, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()}
    )
  );
  t.deepEqual(t.context.log.args[t.context.log.args.length - 1], [
    "The local branch master is behind the remote one, therefore a new version won't be published.",
  ]);
});

test('Returns false if not running from the configured branch', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
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

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'other-branch', isPr: false}),
  });

  t.false(
    await semanticRelease(options, {
      cwd,
      env: {},
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    })
  );
  t.is(
    t.context.log.args[1][0],
    'This test run was triggered on the branch other-branch, while semantic-release is configured to only publish from master, therefore a new version won’t be published.'
  );
});

test('Returns false if there is no relevant changes', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

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

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  t.false(
    await semanticRelease(options, {
      cwd,
      env: {},
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    })
  );
  t.is(analyzeCommits.callCount, 1);
  t.is(verifyRelease.callCount, 0);
  t.is(generateNotes.callCount, 0);
  t.is(publish.callCount, 0);
  t.is(
    t.context.log.args[t.context.log.args.length - 1][0],
    'There are no relevant changes, so no new version is released.'
  );
});

test('Exclude commits with [skip release] or [release skip] from analysis', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  const commits = await gitCommits(
    [
      'Test commit',
      'Test commit [skip release]',
      'Test commit [release skip]',
      'Test commit [Release Skip]',
      'Test commit [Skip Release]',
      'Test commit [skip    release]',
      'Test commit\n\n commit body\n[skip release]',
      'Test commit\n\n commit body\n[release skip]',
    ],
    {cwd}
  );
  await gitPush(repositoryUrl, 'master', {cwd});
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

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  await semanticRelease(options, {
    cwd,
    env: {},
    stdout: new WritableStreamBuffer(),
    stderr: new WritableStreamBuffer(),
  });

  t.is(analyzeCommits.callCount, 1);
  t.is(analyzeCommits.args[0][1].commits.length, 2);
  t.deepEqual(analyzeCommits.args[0][1].commits[0], commits[commits.length - 1]);
});

test('Log both plugins errors and errors thrown by "fail" plugin', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  const pluginError = new SemanticReleaseError('Plugin error', 'ERR');
  const failError1 = new Error('Fail error 1');
  const failError2 = new Error('Fail error 2');

  const options = {
    branch: 'master',
    repositoryUrl,
    verifyConditions: stub().rejects(pluginError),
    fail: [stub().rejects(failError1), stub().rejects(failError2)],
  };
  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  await t.throws(
    semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
  );

  t.is(t.context.error.args[t.context.error.args.length - 1][0], 'ERR Plugin error');
  t.is(t.context.error.args[t.context.error.args.length - 3][1], failError1);
  t.is(t.context.error.args[t.context.error.args.length - 2][1], failError2);
});

test('Call "fail" only if a plugin returns a SemanticReleaseError', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  const pluginError = new Error('Plugin error');
  const fail = stub().resolves();

  const options = {
    branch: 'master',
    repositoryUrl,
    verifyConditions: stub().rejects(pluginError),
    fail,
  };
  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  await t.throws(
    semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
  );

  t.true(fail.notCalled);
  t.is(t.context.error.args[t.context.error.args.length - 1][1], pluginError);
});

test('Throw SemanticReleaseError if repositoryUrl is not set and cannot be found from repo config', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const errors = [
    ...(await t.throws(
      semanticRelease({}, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
    )),
  ];

  // Verify error code and type
  t.is(errors[0].code, 'ENOREPOURL');
  t.is(errors[0].name, 'SemanticReleaseError');
});

test('Throw an Error if plugin returns an unexpected value', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

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

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const error = await t.throws(
    semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()}),
    Error
  );
  t.regex(error.details, /string/);
});

test('Hide sensitive information passed to "fail" plugin', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);

  const fail = stub().resolves();
  const env = {MY_TOKEN: 'secret token'};
  const options = {
    branch: 'master',
    repositoryUrl,
    verifyConditions: stub().throws(
      new SemanticReleaseError(
        `Message: Exposing token ${env.MY_TOKEN}`,
        'ERR',
        `Details: Exposing token ${env.MY_TOKEN}`
      )
    ),
    success: stub().resolves(),
    fail,
  };

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  await t.throws(
    semanticRelease(options, {cwd, env, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()}),
    Error
  );

  const error = fail.args[0][1].errors[0];

  t.is(error.message, `Message: Exposing token ${SECRET_REPLACEMENT}`);
  t.is(error.details, `Details: Exposing token ${SECRET_REPLACEMENT}`);

  Object.getOwnPropertyNames(error).forEach(prop => {
    if (isString(error[prop])) {
      t.notRegex(error[prop], new RegExp(escapeRegExp(env.MY_TOKEN)));
    }
  });
});

test('Hide sensitive information passed to "success" plugin', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['feat: initial release'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitCommits(['feat: new feature'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const success = stub().resolves();
  const env = {MY_TOKEN: 'secret token'};
  const options = {
    branch: 'master',
    repositoryUrl,
    verifyConditions: false,
    verifyRelease: false,
    prepare: false,
    publish: stub().resolves({
      name: `Name: Exposing token ${env.MY_TOKEN}`,
      url: `URL: Exposing token ${env.MY_TOKEN}`,
    }),
    success,
    fail: stub().resolves(),
  };

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  await semanticRelease(options, {cwd, env, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()});

  const release = success.args[0][1].releases[0];

  t.is(release.name, `Name: Exposing token ${SECRET_REPLACEMENT}`);
  t.is(release.url, `URL: Exposing token ${SECRET_REPLACEMENT}`);

  Object.getOwnPropertyNames(release).forEach(prop => {
    if (isString(release[prop])) {
      t.notRegex(release[prop], new RegExp(escapeRegExp(env.MY_TOKEN)));
    }
  });
});

test('Get all commits including the ones not in the shallow clone', async t => {
  let {cwd, repositoryUrl} = await gitRepo(true);
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitCommits(['First', 'Second', 'Third'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  cwd = await gitShallowClone(repositoryUrl);

  const nextRelease = {type: 'major', version: '2.0.0', gitHead: await getGitHead({cwd}), gitTag: 'v2.0.0'};
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

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(
    await semanticRelease(options, {
      cwd,
      env: {},
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    })
  );

  t.is(analyzeCommits.args[0][1].commits.length, 3);
});

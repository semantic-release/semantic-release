const test = require('ava');
const {escapeRegExp, isString, sortBy, omit} = require('lodash');
const proxyquire = require('proxyquire');
const {spy, stub} = require('sinon');
const {WritableStreamBuffer} = require('stream-buffers');
const AggregateError = require('aggregate-error');
const SemanticReleaseError = require('@semantic-release/error');
const {COMMIT_NAME, COMMIT_EMAIL, SECRET_REPLACEMENT} = require('../lib/definitions/constants');
const {
  gitHead: getGitHead,
  gitCheckout,
  gitTagHead,
  gitRepo,
  gitCommits,
  gitTagVersion,
  gitRemoteTagHead,
  gitPush,
  gitShallowClone,
  merge,
  mergeFf,
  rebase,
  gitAddNote,
  gitGetNote,
} = require('./helpers/git-utils');

const requireNoCache = proxyquire.noPreserveCache();
const pluginNoop = require.resolve('./fixtures/plugin-noop');

test.beforeEach((t) => {
  // Stub the logger functions
  t.context.log = spy();
  t.context.error = spy();
  t.context.success = spy();
  t.context.warn = spy();
  t.context.logger = {
    log: t.context.log,
    error: t.context.error,
    success: t.context.success,
    warn: t.context.warn,
    scope: () => t.context.logger,
  };
});

test('Plugins are called with expected values', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  let commits = await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: ['next']}), 'v1.0.0', {cwd});
  commits = (await gitCommits(['Second'], {cwd})).concat(commits);
  await gitCheckout('next', true, {cwd});
  await gitPush(repositoryUrl, 'next', {cwd});
  await gitCheckout('master', false, {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const lastRelease = {
    version: '1.0.0',
    gitHead: commits[commits.length - 1].hash,
    gitTag: 'v1.0.0',
    name: 'v1.0.0',
    channels: ['next'],
  };
  const nextRelease = {
    name: 'v1.1.0',
    type: 'minor',
    version: '1.1.0',
    gitHead: await getGitHead({cwd}),
    gitTag: 'v1.1.0',
    channel: null,
  };
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
  const release2 = {name: 'Release 2', url: 'https://release2.com'};
  const addChannel = stub().resolves(release1);
  const prepare = stub().resolves();
  const publish = stub().resolves(release2);
  const success = stub().resolves();
  const env = {};
  const config = {
    branches: [{name: 'master'}, {name: 'next'}],
    repositoryUrl,
    globalOpt: 'global',
    tagFormat: `v\${version}`,
  };
  const branches = [
    {
      channel: undefined,
      name: 'master',
      range: '>=1.0.0',
      accept: ['patch', 'minor', 'major'],
      tags: [{channels: ['next'], gitTag: 'v1.0.0', version: '1.0.0'}],
      type: 'release',
      main: true,
    },
    {
      channel: 'next',
      name: 'next',
      range: '>=1.0.0',
      accept: ['patch', 'minor', 'major'],
      tags: [{channels: ['next'], gitTag: 'v1.0.0', version: '1.0.0'}],
      type: 'release',
      main: false,
    },
  ];
  const branch = branches[0];
  const options = {
    ...config,
    plugins: false,
    verifyConditions: [verifyConditions1, verifyConditions2],
    analyzeCommits,
    verifyRelease,
    addChannel,
    generateNotes: [generateNotes1, generateNotes2, generateNotes3],
    prepare,
    publish: [publish, pluginNoop],
    success,
  };
  const envCi = {branch: 'master', isCi: true, isPr: false};

  const releases = [
    {
      ...omit(lastRelease, 'channels'),
      ...release1,
      type: 'major',
      version: '1.0.0',
      channel: null,
      gitTag: 'v1.0.0',
      notes: `${notes1}\n\n${notes2}\n\n${notes3}`,
      pluginName: '[Function: functionStub]',
    },
    {...nextRelease, ...release2, notes: `${notes1}\n\n${notes2}\n\n${notes3}`, pluginName: '[Function: functionStub]'},
    {...nextRelease, notes: `${notes1}\n\n${notes2}\n\n${notes3}`, pluginName: pluginNoop},
  ];

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => envCi,
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
  t.deepEqual(verifyConditions1.args[0][1].branch, branch);
  t.deepEqual(verifyConditions1.args[0][1].branches, branches);
  t.deepEqual(verifyConditions1.args[0][1].logger, t.context.logger);
  t.deepEqual(verifyConditions1.args[0][1].envCi, envCi);
  t.is(verifyConditions2.callCount, 1);
  t.deepEqual(verifyConditions2.args[0][0], config);
  t.deepEqual(verifyConditions2.args[0][1].cwd, cwd);
  t.deepEqual(verifyConditions2.args[0][1].options, options);
  t.deepEqual(verifyConditions2.args[0][1].branch, branch);
  t.deepEqual(verifyConditions2.args[0][1].branches, branches);
  t.deepEqual(verifyConditions2.args[0][1].logger, t.context.logger);
  t.deepEqual(verifyConditions2.args[0][1].envCi, envCi);

  t.is(generateNotes1.callCount, 2);
  t.is(generateNotes2.callCount, 2);
  t.is(generateNotes3.callCount, 2);

  t.deepEqual(generateNotes1.args[0][0], config);
  t.deepEqual(generateNotes1.args[0][1].options, options);
  t.deepEqual(generateNotes1.args[0][1].branch, branch);
  t.deepEqual(generateNotes1.args[0][1].branches, branches);
  t.deepEqual(generateNotes1.args[0][1].logger, t.context.logger);
  t.deepEqual(generateNotes1.args[0][1].lastRelease, {});
  t.deepEqual(generateNotes1.args[0][1].commits[0].hash, commits[1].hash);
  t.deepEqual(generateNotes1.args[0][1].commits[0].message, commits[1].message);
  t.deepEqual(generateNotes1.args[0][1].nextRelease, {
    ...omit(lastRelease, 'channels'),
    type: 'major',
    version: '1.0.0',
    channel: null,
    gitTag: 'v1.0.0',
    name: 'v1.0.0',
  });
  t.deepEqual(generateNotes2.args[0][1].envCi, envCi);

  t.deepEqual(generateNotes2.args[0][0], config);
  t.deepEqual(generateNotes2.args[0][1].options, options);
  t.deepEqual(generateNotes2.args[0][1].branch, branch);
  t.deepEqual(generateNotes2.args[0][1].branches, branches);
  t.deepEqual(generateNotes2.args[0][1].logger, t.context.logger);
  t.deepEqual(generateNotes2.args[0][1].lastRelease, {});
  t.deepEqual(generateNotes2.args[0][1].commits[0].hash, commits[1].hash);
  t.deepEqual(generateNotes2.args[0][1].commits[0].message, commits[1].message);
  t.deepEqual(generateNotes2.args[0][1].nextRelease, {
    ...omit(lastRelease, 'channels'),
    type: 'major',
    version: '1.0.0',
    channel: null,
    gitTag: 'v1.0.0',
    name: 'v1.0.0',
    notes: notes1,
  });
  t.deepEqual(generateNotes2.args[0][1].envCi, envCi);

  t.deepEqual(generateNotes3.args[0][0], config);
  t.deepEqual(generateNotes3.args[0][1].options, options);
  t.deepEqual(generateNotes3.args[0][1].branch, branch);
  t.deepEqual(generateNotes3.args[0][1].branches, branches);
  t.deepEqual(generateNotes3.args[0][1].logger, t.context.logger);
  t.deepEqual(generateNotes3.args[0][1].lastRelease, {});
  t.deepEqual(generateNotes3.args[0][1].commits[0].hash, commits[1].hash);
  t.deepEqual(generateNotes3.args[0][1].commits[0].message, commits[1].message);
  t.deepEqual(generateNotes3.args[0][1].nextRelease, {
    ...omit(lastRelease, 'channels'),
    type: 'major',
    version: '1.0.0',
    channel: null,
    gitTag: 'v1.0.0',
    name: 'v1.0.0',
    notes: `${notes1}\n\n${notes2}`,
  });
  t.deepEqual(generateNotes3.args[0][1].envCi, envCi);

  branch.tags.push({
    version: '1.0.0',
    channel: null,
    gitTag: 'v1.0.0',
    gitHead: commits[commits.length - 1].hash,
  });

  t.is(addChannel.callCount, 1);
  t.deepEqual(addChannel.args[0][0], config);
  t.deepEqual(addChannel.args[0][1].options, options);
  t.deepEqual(addChannel.args[0][1].branch, branch);
  t.deepEqual(addChannel.args[0][1].branches, branches);
  t.deepEqual(addChannel.args[0][1].logger, t.context.logger);
  t.deepEqual(addChannel.args[0][1].lastRelease, {});
  t.deepEqual(addChannel.args[0][1].currentRelease, {...lastRelease, type: 'major'});
  t.deepEqual(addChannel.args[0][1].nextRelease, {
    ...omit(lastRelease, 'channels'),
    type: 'major',
    version: '1.0.0',
    channel: null,
    gitTag: 'v1.0.0',
    name: 'v1.0.0',
    notes: `${notes1}\n\n${notes2}\n\n${notes3}`,
  });
  t.deepEqual(addChannel.args[0][1].commits[0].hash, commits[1].hash);
  t.deepEqual(addChannel.args[0][1].commits[0].message, commits[1].message);
  t.deepEqual(addChannel.args[0][1].envCi, envCi);

  t.is(analyzeCommits.callCount, 1);
  t.deepEqual(analyzeCommits.args[0][0], config);
  t.deepEqual(analyzeCommits.args[0][1].options, options);
  t.deepEqual(analyzeCommits.args[0][1].branch, branch);
  t.deepEqual(analyzeCommits.args[0][1].branches, branches);
  t.deepEqual(analyzeCommits.args[0][1].logger, t.context.logger);
  t.deepEqual(analyzeCommits.args[0][1].lastRelease, lastRelease);
  t.deepEqual(analyzeCommits.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(analyzeCommits.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(analyzeCommits.args[0][1].envCi, envCi);

  t.is(verifyRelease.callCount, 1);
  t.deepEqual(verifyRelease.args[0][0], config);
  t.deepEqual(verifyRelease.args[0][1].options, options);
  t.deepEqual(verifyRelease.args[0][1].branch, branch);
  t.deepEqual(verifyRelease.args[0][1].branches, branches);
  t.deepEqual(verifyRelease.args[0][1].logger, t.context.logger);
  t.deepEqual(verifyRelease.args[0][1].lastRelease, lastRelease);
  t.deepEqual(verifyRelease.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(verifyRelease.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(verifyRelease.args[0][1].nextRelease, nextRelease);
  t.deepEqual(verifyRelease.args[0][1].envCi, envCi);

  t.deepEqual(generateNotes1.args[1][0], config);
  t.deepEqual(generateNotes1.args[1][1].options, options);
  t.deepEqual(generateNotes1.args[1][1].branch, branch);
  t.deepEqual(generateNotes1.args[1][1].branches, branches);
  t.deepEqual(generateNotes1.args[1][1].logger, t.context.logger);
  t.deepEqual(generateNotes1.args[1][1].lastRelease, lastRelease);
  t.deepEqual(generateNotes1.args[1][1].commits[0].hash, commits[0].hash);
  t.deepEqual(generateNotes1.args[1][1].commits[0].message, commits[0].message);
  t.deepEqual(generateNotes1.args[1][1].nextRelease, nextRelease);
  t.deepEqual(generateNotes1.args[1][1].envCi, envCi);

  t.deepEqual(generateNotes2.args[1][0], config);
  t.deepEqual(generateNotes2.args[1][1].options, options);
  t.deepEqual(generateNotes2.args[1][1].branch, branch);
  t.deepEqual(generateNotes2.args[1][1].branches, branches);
  t.deepEqual(generateNotes2.args[1][1].logger, t.context.logger);
  t.deepEqual(generateNotes2.args[1][1].lastRelease, lastRelease);
  t.deepEqual(generateNotes2.args[1][1].commits[0].hash, commits[0].hash);
  t.deepEqual(generateNotes2.args[1][1].commits[0].message, commits[0].message);
  t.deepEqual(generateNotes2.args[1][1].nextRelease, {...nextRelease, notes: notes1});
  t.deepEqual(generateNotes2.args[1][1].envCi, envCi);

  t.deepEqual(generateNotes3.args[1][0], config);
  t.deepEqual(generateNotes3.args[1][1].options, options);
  t.deepEqual(generateNotes3.args[1][1].branch, branch);
  t.deepEqual(generateNotes3.args[1][1].branches, branches);
  t.deepEqual(generateNotes3.args[1][1].logger, t.context.logger);
  t.deepEqual(generateNotes3.args[1][1].lastRelease, lastRelease);
  t.deepEqual(generateNotes3.args[1][1].commits[0].hash, commits[0].hash);
  t.deepEqual(generateNotes3.args[1][1].commits[0].message, commits[0].message);
  t.deepEqual(generateNotes3.args[1][1].nextRelease, {...nextRelease, notes: `${notes1}\n\n${notes2}`});
  t.deepEqual(generateNotes3.args[1][1].envCi, envCi);

  t.is(prepare.callCount, 1);
  t.deepEqual(prepare.args[0][0], config);
  t.deepEqual(prepare.args[0][1].options, options);
  t.deepEqual(prepare.args[0][1].branch, branch);
  t.deepEqual(prepare.args[0][1].branches, branches);
  t.deepEqual(prepare.args[0][1].logger, t.context.logger);
  t.deepEqual(prepare.args[0][1].lastRelease, lastRelease);
  t.deepEqual(prepare.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(prepare.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(prepare.args[0][1].nextRelease, {...nextRelease, notes: `${notes1}\n\n${notes2}\n\n${notes3}`});
  t.deepEqual(prepare.args[0][1].envCi, envCi);

  t.is(publish.callCount, 1);
  t.deepEqual(publish.args[0][0], config);
  t.deepEqual(publish.args[0][1].options, options);
  t.deepEqual(publish.args[0][1].branch, branch);
  t.deepEqual(publish.args[0][1].branches, branches);
  t.deepEqual(publish.args[0][1].logger, t.context.logger);
  t.deepEqual(publish.args[0][1].lastRelease, lastRelease);
  t.deepEqual(publish.args[0][1].commits[0].hash, commits[0].hash);
  t.deepEqual(publish.args[0][1].commits[0].message, commits[0].message);
  t.deepEqual(publish.args[0][1].nextRelease, {...nextRelease, notes: `${notes1}\n\n${notes2}\n\n${notes3}`});
  t.deepEqual(publish.args[0][1].envCi, envCi);

  t.is(success.callCount, 2);
  t.deepEqual(success.args[0][0], config);
  t.deepEqual(success.args[0][1].options, options);
  t.deepEqual(success.args[0][1].branch, branch);
  t.deepEqual(success.args[0][1].branches, branches);
  t.deepEqual(success.args[0][1].logger, t.context.logger);
  t.deepEqual(success.args[0][1].lastRelease, {});
  t.deepEqual(success.args[0][1].commits[0].hash, commits[1].hash);
  t.deepEqual(success.args[0][1].commits[0].message, commits[1].message);
  t.deepEqual(success.args[0][1].nextRelease, {
    ...omit(lastRelease, 'channels'),
    type: 'major',
    version: '1.0.0',
    channel: null,
    gitTag: 'v1.0.0',
    name: 'v1.0.0',
    notes: `${notes1}\n\n${notes2}\n\n${notes3}`,
  });
  t.deepEqual(success.args[0][1].releases, [releases[0]]);
  t.deepEqual(success.args[0][1].envCi, envCi);

  t.deepEqual(success.args[1][0], config);
  t.deepEqual(success.args[1][1].options, options);
  t.deepEqual(success.args[1][1].branch, branch);
  t.deepEqual(success.args[1][1].branches, branches);
  t.deepEqual(success.args[1][1].logger, t.context.logger);
  t.deepEqual(success.args[1][1].lastRelease, lastRelease);
  t.deepEqual(success.args[1][1].commits[0].hash, commits[0].hash);
  t.deepEqual(success.args[1][1].commits[0].message, commits[0].message);
  t.deepEqual(success.args[1][1].nextRelease, {...nextRelease, notes: `${notes1}\n\n${notes2}\n\n${notes3}`});
  t.deepEqual(success.args[1][1].releases, [releases[1], releases[2]]);
  t.deepEqual(success.args[1][1].envCi, envCi);

  t.deepEqual(result, {
    lastRelease,
    commits: [{...commits[0], gitTags: '(HEAD -> master, next)'}],
    nextRelease: {...nextRelease, notes: `${notes1}\n\n${notes2}\n\n${notes3}`},
    releases,
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

test('Use custom tag format', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['First'], {cwd});
  await gitTagVersion('test-1.0.0', undefined, {cwd});
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const nextRelease = {
    name: 'test-2.0.0',
    type: 'major',
    version: '2.0.0',
    gitHead: await getGitHead({cwd}),
    gitTag: 'test-2.0.0',
  };
  const notes = 'Release notes';
  const config = {branches: 'master', repositoryUrl, globalOpt: 'global', tagFormat: `test-\${version}`};
  const options = {
    ...config,
    verifyConditions: stub().resolves(),
    analyzeCommits: stub().resolves(nextRelease.type),
    verifyRelease: stub().resolves(),
    generateNotes: stub().resolves(notes),
    addChannel: stub().resolves(),
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

test('Use new gitHead, and recreate release notes if a prepare plugin create a commit', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  let commits = await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  commits = (await gitCommits(['Second'], {cwd})).concat(commits);
  await gitPush(repositoryUrl, 'master', {cwd});

  const nextRelease = {
    name: 'v2.0.0',
    type: 'major',
    version: '2.0.0',
    gitHead: await getGitHead({cwd}),
    gitTag: 'v2.0.0',
    channel: null,
  };
  const notes = 'Release notes';

  const generateNotes = stub().resolves(notes);
  const prepare1 = stub().callsFake(async () => {
    commits = (await gitCommits(['Third'], {cwd})).concat(commits);
  });
  const prepare2 = stub().resolves();
  const publish = stub().resolves();
  const options = {
    branches: ['master'],
    repositoryUrl,
    verifyConditions: stub().resolves(),
    analyzeCommits: stub().resolves(nextRelease.type),
    verifyRelease: stub().resolves(),
    generateNotes,
    addChannel: stub().resolves(),
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

test('Make a new release when a commit is forward-ported to an upper branch', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['feat: initial release'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: [null, '1.0.x']}), 'v1.0.0', {cwd});
  await gitCheckout('1.0.x', true, {cwd});
  await gitCommits(['fix: fix on maintenance version 1.0.x'], {cwd});
  await gitTagVersion('v1.0.1', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: ['1.0.x']}), 'v1.0.1', {cwd});
  await gitPush('origin', '1.0.x', {cwd});
  await gitCheckout('master', false, {cwd});
  await gitCommits(['feat: new feature on master'], {cwd});
  await gitTagVersion('v1.1.0', undefined, {cwd});
  await merge('1.0.x', {cwd});
  await gitPush('origin', 'master', {cwd});

  const verifyConditions = stub().resolves();
  const verifyRelease = stub().resolves();
  const addChannel = stub().resolves();
  const prepare = stub().resolves();
  const publish = stub().resolves();
  const success = stub().resolves();

  const config = {branches: [{name: '1.0.x'}, {name: 'master'}], repositoryUrl, tagFormat: `v\${version}`};
  const options = {
    ...config,
    verifyConditions,
    verifyRelease,
    addChannel,
    prepare,
    publish,
    success,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(await semanticRelease(options, {cwd, env: {}, stdout: {write: () => {}}, stderr: {write: () => {}}}));

  t.is(addChannel.callCount, 0);
  t.is(publish.callCount, 1);
  // The release 1.1.1, triggered by the forward-port of "fix: fix on maintenance version 1.0.x" has been published from master
  t.is(publish.args[0][1].nextRelease.version, '1.1.1');
  t.is(success.callCount, 1);
});

test('Publish a pre-release version', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['feat: initial commit'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  await gitCheckout('beta', true, {cwd});
  await gitCommits(['feat: a feature'], {cwd});
  await gitPush(repositoryUrl, 'beta', {cwd});

  const config = {branches: ['master', {name: 'beta', prerelease: true}], repositoryUrl};
  const options = {
    ...config,
    verifyConditions: stub().resolves(),
    verifyRelease: stub().resolves(),
    generateNotes: stub().resolves(''),
    addChannel: false,
    prepare: stub().resolves(),
    publish: stub().resolves(),
    success: stub().resolves(),
    fail: stub().resolves(),
  };

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'beta', isPr: false}),
  });
  let {releases} = await semanticRelease(options, {cwd, env: {}, stdout: {write: () => {}}, stderr: {write: () => {}}});

  t.is(releases.length, 1);
  t.is(releases[0].version, '1.1.0-beta.1');
  t.is(releases[0].gitTag, 'v1.1.0-beta.1');
  t.is(await gitGetNote('v1.1.0-beta.1', {cwd}), '{"channels":["beta"]}');

  await gitCommits(['fix: a fix'], {cwd});
  ({releases} = await semanticRelease(options, {
    cwd,
    env: {},
    stdout: {write: () => {}},
    stderr: {write: () => {}},
  }));

  t.is(releases.length, 1);
  t.is(releases[0].version, '1.1.0-beta.2');
  t.is(releases[0].gitTag, 'v1.1.0-beta.2');
  t.is(await gitGetNote('v1.1.0-beta.2', {cwd}), '{"channels":["beta"]}');
});

test('Publish releases from different branch on the same channel', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['feat: initial commit'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  await gitCheckout('next-major', true, {cwd});
  await gitPush(repositoryUrl, 'next-major', {cwd});
  await gitCheckout('next', true, {cwd});
  await gitCommits(['feat: a feature'], {cwd});
  await gitPush(repositoryUrl, 'next', {cwd});

  const config = {
    branches: ['master', {name: 'next', channel: false}, {name: 'next-major', channel: false}],
    repositoryUrl,
  };
  const addChannel = stub().resolves({});
  const options = {
    ...config,
    verifyConditions: stub().resolves(),
    verifyRelease: stub().resolves(),
    generateNotes: stub().resolves(''),
    addChannel,
    prepare: stub().resolves(),
    publish: stub().resolves(),
    success: stub().resolves(),
    fail: stub().resolves(),
  };

  let semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'next', isPr: false}),
  });
  let {releases} = await semanticRelease(options, {cwd, env: {}, stdout: {write: () => {}}, stderr: {write: () => {}}});

  t.is(releases.length, 1);
  t.is(releases[0].version, '1.1.0');
  t.is(releases[0].gitTag, 'v1.1.0');

  await gitCommits(['fix: a fix'], {cwd});
  ({releases} = await semanticRelease(options, {
    cwd,
    env: {},
    stdout: {write: () => {}},
    stderr: {write: () => {}},
  }));

  t.is(releases.length, 1);
  t.is(releases[0].version, '1.1.1');
  t.is(releases[0].gitTag, 'v1.1.1');

  await gitCheckout('master', false, {cwd});
  await merge('next', {cwd});
  await gitPush('origin', 'master', {cwd});

  semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  t.falsy(await semanticRelease(options, {cwd, env: {}, stdout: {write: () => {}}, stderr: {write: () => {}}}));
  t.is(addChannel.callCount, 0);
});

test('Publish pre-releases the same channel as regular releases', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['feat: initial commit'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  await gitCheckout('beta', true, {cwd});
  await gitCommits(['feat: a feature'], {cwd});
  await gitPush(repositoryUrl, 'beta', {cwd});

  const config = {
    branches: ['master', {name: 'beta', channel: false, prerelease: true}],
    repositoryUrl,
  };
  const options = {
    ...config,
    verifyConditions: stub().resolves(),
    verifyRelease: stub().resolves(),
    generateNotes: stub().resolves(''),
    addChannel: false,
    prepare: stub().resolves(),
    publish: stub().resolves(),
    success: stub().resolves(),
    fail: stub().resolves(),
  };

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'beta', isPr: false}),
  });
  let {releases} = await semanticRelease(options, {cwd, env: {}, stdout: {write: () => {}}, stderr: {write: () => {}}});

  t.is(releases.length, 1);
  t.is(releases[0].version, '1.1.0-beta.1');
  t.is(releases[0].gitTag, 'v1.1.0-beta.1');

  await gitCommits(['fix: a fix'], {cwd});
  ({releases} = await semanticRelease(options, {
    cwd,
    env: {},
    stdout: {write: () => {}},
    stderr: {write: () => {}},
  }));

  t.is(releases.length, 1);
  t.is(releases[0].version, '1.1.0-beta.2');
  t.is(releases[0].gitTag, 'v1.1.0-beta.2');
});

test('Do not add pre-releases to a different channel', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['feat: initial release'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: [null, 'beta']}), 'v1.0.0', {cwd});
  await gitCheckout('beta', true, {cwd});
  await gitCommits(['feat: breaking change/n/nBREAKING CHANGE: break something'], {cwd});
  await gitTagVersion('v2.0.0-beta.1', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: ['beta']}), 'v2.0.0-beta.1', {cwd});
  await gitCommits(['fix: a fix'], {cwd});
  await gitTagVersion('v2.0.0-beta.2', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: ['beta']}), 'v2.0.0-beta.2', {cwd});
  await gitPush('origin', 'beta', {cwd});
  await gitCheckout('master', false, {cwd});
  await merge('beta', {cwd});
  await gitPush('origin', 'master', {cwd});

  const verifyConditions = stub().resolves();
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves('Release notes');
  const release1 = {name: 'Release 1', url: 'https://release1.com'};
  const addChannel = stub().resolves(release1);
  const prepare = stub().resolves();
  const publish = stub().resolves();
  const success = stub().resolves();

  const config = {
    branches: [{name: 'master'}, {name: 'beta', prerelease: 'beta'}],
    repositoryUrl,
    tagFormat: `v\${version}`,
  };

  const options = {
    ...config,
    verifyConditions,
    verifyRelease,
    addChannel,
    generateNotes,
    prepare,
    publish,
    success,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  t.truthy(await semanticRelease(options, {cwd, env: {}, stdout: {write: () => {}}, stderr: {write: () => {}}}));

  t.is(addChannel.callCount, 0);
});

async function addChannelMacro(t, mergeFunction) {
  const {cwd, repositoryUrl} = await gitRepo(true);
  const commits = await gitCommits(['feat: initial release'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: [null, 'next']}), 'v1.0.0', {cwd});
  await gitCheckout('next', true, {cwd});
  commits.push(...(await gitCommits(['feat: breaking change/n/nBREAKING CHANGE: break something'], {cwd})));
  await gitTagVersion('v2.0.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: ['next']}), 'v2.0.0', {cwd});

  commits.push(...(await gitCommits(['fix: a fix'], {cwd})));
  await gitTagVersion('v2.0.1', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: ['next']}), 'v2.0.1', {cwd});
  commits.push(...(await gitCommits(['feat: a feature'], {cwd})));
  await gitTagVersion('v2.1.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: ['next']}), 'v2.1.0', {cwd});
  await gitPush('origin', 'next', {cwd});
  await gitCheckout('master', false, {cwd});
  // Merge all commits but last one from next to master
  await mergeFunction('next~1', {cwd});
  await gitPush('origin', 'master', {cwd});

  const notes = 'Release notes';
  const verifyConditions = stub().resolves();
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const release1 = {name: 'Release 1', url: 'https://release1.com'};
  const addChannel1 = stub().resolves(release1);
  const addChannel2 = stub().resolves();
  const prepare = stub().resolves();
  const publish = stub().resolves();
  const success = stub().resolves();

  const config = {
    branches: [
      {name: 'master', channel: 'latest'},
      {name: 'next', channel: 'next'},
    ],
    repositoryUrl,
    tagFormat: `v\${version}`,
  };
  const options = {
    ...config,
    verifyConditions,
    verifyRelease,
    addChannel: [addChannel1, addChannel2],
    generateNotes,
    prepare,
    publish,
    success,
  };
  const nextRelease = {
    name: 'v2.0.1',
    type: 'patch',
    version: '2.0.1',
    channel: 'latest',
    gitTag: 'v2.0.1',
    gitHead: commits[2].hash,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const result = await semanticRelease(options, {cwd, env: {}, stdout: {write: () => {}}, stderr: {write: () => {}}});

  t.deepEqual(result.releases, [
    {...nextRelease, ...release1, notes, pluginName: '[Function: functionStub]'},
    {...nextRelease, notes, pluginName: '[Function: functionStub]'},
  ]);

  // Verify the tag has been created on the local and remote repo and reference
  t.is(await gitTagHead(nextRelease.gitTag, {cwd}), nextRelease.gitHead);
  t.is(await gitRemoteTagHead(repositoryUrl, nextRelease.gitTag, {cwd}), nextRelease.gitHead);
}

addChannelMacro.title = (providedTitle) => `Add version to a channel after a merge (${providedTitle})`;

test('fast-forward', addChannelMacro, mergeFf);
test('non fast-forward', addChannelMacro, merge);
test('rebase', addChannelMacro, rebase);

test('Call all "success" plugins even if one errors out', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const nextRelease = {
    name: 'v2.0.0',
    type: 'major',
    version: '2.0.0',
    gitHead: await getGitHead({cwd}),
    gitTag: 'v2.0.0',
    channel: null,
  };
  const notes = 'Release notes';
  const verifyConditions1 = stub().resolves();
  const verifyConditions2 = stub().resolves();
  const analyzeCommits = stub().resolves(nextRelease.type);
  const generateNotes = stub().resolves(notes);
  const release = {name: 'Release', url: 'https://release.com'};
  const publish = stub().resolves(release);
  const success1 = stub().rejects();
  const success2 = stub().resolves();
  const config = {
    branches: [{name: 'master'}],
    repositoryUrl,
    globalOpt: 'global',
    tagFormat: `v\${version}`,
  };
  const options = {
    ...config,
    verifyConditions: [verifyConditions1, verifyConditions2],
    analyzeCommits,
    generateNotes,
    addChannel: stub().resolves(),
    prepare: stub().resolves(),
    publish,
    success: [success1, success2],
  };

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  await t.throwsAsync(
    semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
  );

  t.is(success1.callCount, 1);
  t.deepEqual(success1.args[0][0], config);
  t.deepEqual(success1.args[0][1].releases, [
    {...nextRelease, ...release, notes, pluginName: '[Function: functionStub]'},
  ]);

  t.is(success2.callCount, 1);
  t.deepEqual(success2.args[0][1].releases, [
    {...nextRelease, ...release, notes, pluginName: '[Function: functionStub]'},
  ]);
});

test('Log all "verifyConditions" errors', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const error1 = new Error('error 1');
  const error2 = new SemanticReleaseError('error 2', 'ERR2');
  const error3 = new SemanticReleaseError('error 3', 'ERR3');
  const fail = stub().resolves();
  const config = {branches: [{name: 'master'}], repositoryUrl, tagFormat: `v\${version}`};
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
    ...(await t.throwsAsync(
      semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
    )),
  ];

  t.deepEqual(sortBy(errors, ['message']), sortBy([error1, error2, error3], ['message']));
  t.true(t.context.error.calledWith('An error occurred while running semantic-release: %O', error1));
  t.true(t.context.error.calledWith('ERR2 error 2'));
  t.true(t.context.error.calledWith('ERR3 error 3'));
  t.true(t.context.error.calledAfter(t.context.log));
  t.is(fail.callCount, 1);
  t.deepEqual(fail.args[0][0], config);
  t.deepEqual(fail.args[0][1].options, options);
  t.deepEqual(fail.args[0][1].logger, t.context.logger);
  t.deepEqual(fail.args[0][1].errors, [error2, error3]);
});

test('Log all "verifyRelease" errors', async (t) => {
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
  const config = {branches: [{name: 'master'}], repositoryUrl, tagFormat: `v\${version}`};
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
    ...(await t.throwsAsync(
      semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
    )),
  ];

  t.deepEqual(sortBy(errors, ['message']), sortBy([error1, error2], ['message']));
  t.true(t.context.error.calledWith('ERR1 error 1'));
  t.true(t.context.error.calledWith('ERR2 error 2'));
  t.is(fail.callCount, 1);
  t.deepEqual(fail.args[0][0], config);
  t.deepEqual(fail.args[0][1].errors, [error1, error2]);
});

test('Dry-run skips addChannel, prepare, publish and success', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['First'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: [null, 'next']}), 'v1.0.0', {cwd});
  await gitCommits(['Second'], {cwd});
  await gitTagVersion('v1.1.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: ['next']}), 'v1.1.0', {cwd});

  await gitPush(repositoryUrl, 'master', {cwd});
  await gitCheckout('next', true, {cwd});
  await gitPush('origin', 'next', {cwd});

  const verifyConditions = stub().resolves();
  const analyzeCommits = stub().resolves('minor');
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves();
  const addChannel = stub().resolves();
  const prepare = stub().resolves();
  const publish = stub().resolves();
  const success = stub().resolves();

  const options = {
    dryRun: true,
    branches: ['master', 'next'],
    repositoryUrl,
    verifyConditions,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    addChannel,
    prepare,
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

  t.not(t.context.warn.args[0][0], 'This run was not triggered in a known CI environment, running in dry-run mode.');
  t.is(verifyConditions.callCount, 1);
  t.is(analyzeCommits.callCount, 1);
  t.is(verifyRelease.callCount, 1);
  t.is(generateNotes.callCount, 2);
  t.is(addChannel.callCount, 0);
  t.true(
    t.context.warn.calledWith(`Skip step "addChannel" of plugin "[Function: ${addChannel.name}]" in dry-run mode`)
  );
  t.is(prepare.callCount, 0);
  t.true(t.context.warn.calledWith(`Skip step "prepare" of plugin "[Function: ${prepare.name}]" in dry-run mode`));
  t.is(publish.callCount, 0);
  t.true(t.context.warn.calledWith(`Skip step "publish" of plugin "[Function: ${publish.name}]" in dry-run mode`));
  t.is(success.callCount, 0);
  t.true(t.context.warn.calledWith(`Skip step "success" of plugin "[Function: ${success.name}]" in dry-run mode`));
});

test('Dry-run skips fail', async (t) => {
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
    branches: ['master'],
    repositoryUrl,
    verifyConditions: [stub().rejects(error1), stub().rejects(error2)],
    fail,
  };

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const errors = [
    ...(await t.throwsAsync(
      semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
    )),
  ];

  t.deepEqual(sortBy(errors, ['message']), sortBy([error1, error2], ['message']));
  t.true(t.context.error.calledWith('ERR1 error 1'));
  t.true(t.context.error.calledWith('ERR2 error 2'));
  t.is(fail.callCount, 0);
  t.true(t.context.warn.calledWith(`Skip step "fail" of plugin "[Function: ${fail.name}]" in dry-run mode`));
});

test('Force a dry-run if not on a CI and "noCi" is not explicitly set', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const nextRelease = {
    name: 'v2.0.0',
    type: 'major',
    version: '2.0.0',
    gitHead: await getGitHead({cwd}),
    gitTag: 'v2.0.0',
    channel: undefined,
  };
  const notes = 'Release notes';

  const verifyConditions = stub().resolves();
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const publish = stub().resolves();
  const success = stub().resolves();

  const options = {
    dryRun: false,
    branches: ['master'],
    repositoryUrl,
    verifyConditions,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    addChannel: stub().resolves(),
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

  t.true(t.context.warn.calledWith('This run was not triggered in a known CI environment, running in dry-run mode.'));
  t.is(verifyConditions.callCount, 1);
  t.is(analyzeCommits.callCount, 1);
  t.is(verifyRelease.callCount, 1);
  t.is(generateNotes.callCount, 1);
  t.is(publish.callCount, 0);
  t.is(success.callCount, 0);
});

test('Dry-run does not print changelog if "generateNotes" return "undefined"', async (t) => {
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
    branches: ['master'],
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

test('Allow local releases with "noCi" option', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  // Add commits to the master branch
  await gitCommits(['First'], {cwd});
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion('v1.0.0', undefined, {cwd});
  // Add new commits to the master branch
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  const nextRelease = {
    name: 'v2.0.0',
    type: 'major',
    version: '2.0.0',
    gitHead: await getGitHead({cwd}),
    gitTag: 'v2.0.0',
    channel: undefined,
  };
  const notes = 'Release notes';

  const verifyConditions = stub().resolves();
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const publish = stub().resolves();
  const success = stub().resolves();

  const options = {
    noCi: true,
    branches: ['master'],
    repositoryUrl,
    verifyConditions,
    analyzeCommits,
    verifyRelease,
    generateNotes,
    addChannel: stub().resolves(),
    prepare: stub().resolves(),
    publish,
    success,
    fail: stub().resolves(),
  };

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: false, branch: 'master', isPr: false}),
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

test('Accept "undefined" value returned by "generateNotes" and "false" by "publish" and "addChannel"', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['First'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: [null, 'next']}), 'v1.0.0', {cwd});
  await gitCommits(['Second'], {cwd});
  await gitTagVersion('v1.1.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: ['next']}), 'v1.1.0', {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  await gitCheckout('next', true, {cwd});
  await gitPush('origin', 'next', {cwd});
  await gitCheckout('master', false, {cwd});

  const nextRelease = {
    name: 'v1.2.0',
    type: 'minor',
    version: '1.2.0',
    gitHead: await getGitHead({cwd}),
    gitTag: 'v1.2.0',
    channel: null,
  };
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes1 = stub().resolves();
  const notes2 = 'Release notes 2';
  const generateNotes2 = stub().resolves(notes2);
  const publish = stub().resolves(false);
  const addChannel = stub().resolves(false);
  const success = stub().resolves();

  const options = {
    branches: ['master', 'next'],
    repositoryUrl,
    verifyConditions: stub().resolves(),
    analyzeCommits,
    verifyRelease,
    generateNotes: [generateNotes1, generateNotes2],
    addChannel,
    prepare: stub().resolves(),
    publish,
    success,
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
  t.is(verifyRelease.callCount, 1);
  t.is(generateNotes1.callCount, 2);
  t.is(generateNotes2.callCount, 2);
  t.is(addChannel.callCount, 1);
  t.is(publish.callCount, 1);
  t.is(success.callCount, 2);
  t.deepEqual(publish.args[0][1].nextRelease, {...nextRelease, notes: notes2});
  t.deepEqual(success.args[0][1].releases, [{pluginName: '[Function: functionStub]'}]);
  t.deepEqual(success.args[1][1].releases, [{pluginName: '[Function: functionStub]'}]);
});

test('Returns false if triggered by a PR', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', prBranch: 'patch-1', isPr: true}),
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

test('Throws "EINVALIDNEXTVERSION" if next release is out of range of the current maintenance branch', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['feat: initial commit'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: [null, '1.x']}), 'v1.0.0', {cwd});
  await gitCheckout('1.x', true, {cwd});
  await gitPush('origin', '1.x', {cwd});
  await gitCheckout('master', false, {cwd});
  await gitCommits(['feat: new feature on master'], {cwd});
  await gitTagVersion('v1.1.0', undefined, {cwd});
  await gitCheckout('1.x', false, {cwd});
  await gitCommits(['feat: feature on maintenance version 1.x'], {cwd});
  await gitPush('origin', 'master', {cwd});

  const verifyConditions = stub().resolves();
  const verifyRelease = stub().resolves();
  const addChannel = stub().resolves();
  const prepare = stub().resolves();
  const publish = stub().resolves();
  const success = stub().resolves();

  const config = {
    branches: [{name: '1.x'}, {name: 'master'}],
    repositoryUrl,
    tagFormat: `v\${version}`,
  };
  const options = {
    ...config,
    verifyConditions,
    verifyRelease,
    addChannel,
    prepare,
    publish,
    success,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: '1.x', isPr: false}),
  });

  const error = await t.throwsAsync(
    semanticRelease(options, {cwd, env: {}, stdout: {write: () => {}}, stderr: {write: () => {}}})
  );

  t.is(error.code, 'EINVALIDNEXTVERSION');
  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'The release `1.1.0` on branch `1.x` cannot be published as it is out of range.');
  t.regex(error.details, /A valid branch could be `master`./);
});

test('Throws "EINVALIDNEXTVERSION" if next release is out of range of the current release branch', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['feat: initial commit'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitCheckout('next', true, {cwd});
  await gitCommits(['feat: new feature on next'], {cwd});
  await gitTagVersion('v1.1.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: ['next']}), 'v1.1.0', {cwd});
  await gitPush('origin', 'next', {cwd});
  await gitCheckout('next-major', true, {cwd});
  await gitPush('origin', 'next-major', {cwd});
  await gitCheckout('master', false, {cwd});
  await gitCommits(['feat: new feature on master', 'fix: new fix on master'], {cwd});
  await gitPush('origin', 'master', {cwd});

  const verifyConditions = stub().resolves();
  const verifyRelease = stub().resolves();
  const addChannel = stub().resolves();
  const prepare = stub().resolves();
  const publish = stub().resolves();
  const success = stub().resolves();

  const config = {
    branches: [{name: 'master'}, {name: 'next'}, {name: 'next-major'}],
    repositoryUrl,
    tagFormat: `v\${version}`,
  };
  const options = {
    ...config,
    verifyConditions,
    verifyRelease,
    addChannel,
    prepare,
    publish,
    success,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  const error = await t.throwsAsync(
    semanticRelease(options, {cwd, env: {}, stdout: {write: () => {}}, stderr: {write: () => {}}})
  );

  t.is(error.code, 'EINVALIDNEXTVERSION');
  t.is(error.name, 'SemanticReleaseError');
  t.is(error.message, 'The release `1.1.0` on branch `master` cannot be published as it is out of range.');
  t.regex(error.details, /A valid branch could be `next` or `next-major`./);
});

test('Throws "EINVALIDMAINTENANCEMERGE" if merge an out of range release in a maintenance branch', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['First'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: [null, '1.1.x']}), 'v1.0.0', {cwd});
  await gitCommits(['Second'], {cwd});
  await gitTagVersion('v1.1.0', undefined, {cwd});
  await gitAddNote(JSON.stringify({channels: [null, '1.1.x']}), 'v1.1.0', {cwd});
  await gitCheckout('1.1.x', 'master', {cwd});
  await gitPush('origin', '1.1.x', {cwd});
  await gitCheckout('master', false, {cwd});
  await gitCommits(['Third'], {cwd});
  await gitTagVersion('v1.1.1', undefined, {cwd});
  await gitCommits(['Fourth'], {cwd});
  await gitTagVersion('v1.2.0', undefined, {cwd});
  await gitPush('origin', 'master', {cwd});
  await gitCheckout('1.1.x', false, {cwd});
  await merge('master', {cwd});
  await gitPush('origin', '1.1.x', {cwd});

  const notes = 'Release notes';
  const verifyConditions = stub().resolves();
  const analyzeCommits = stub().resolves();
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const addChannel = stub().resolves();
  const prepare = stub().resolves();
  const publish = stub().resolves();
  const success = stub().resolves();
  const fail = stub().resolves();

  const config = {branches: [{name: 'master'}, {name: '1.1.x'}], repositoryUrl, tagFormat: `v\${version}`};
  const options = {
    ...config,
    verifyConditions,
    analyzeCommits,
    verifyRelease,
    addChannel,
    generateNotes,
    prepare,
    publish,
    success,
    fail,
  };

  const semanticRelease = proxyquire('..', {
    './lib/logger': t.context.logger,
    'env-ci': () => ({isCi: true, branch: '1.1.x', isPr: false}),
  });
  const errors = [
    ...(await t.throwsAsync(
      semanticRelease(options, {cwd, env: {}, stdout: {write: () => {}}, stderr: {write: () => {}}})
    )),
  ];

  t.is(addChannel.callCount, 0);

  t.is(publish.callCount, 0);

  t.is(success.callCount, 0);

  t.is(fail.callCount, 1);
  t.deepEqual(fail.args[0][1].errors, errors);

  t.is(errors[0].code, 'EINVALIDMAINTENANCEMERGE');
  t.is(errors[0].name, 'SemanticReleaseError');
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
});

test('Returns false value if triggered on an outdated clone', async (t) => {
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

test('Returns false if not running from the configured branch', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd, repositoryUrl} = await gitRepo(true);
  const options = {
    branches: ['master'],
    repositoryUrl,
    verifyConditions: stub().resolves(),
    analyzeCommits: stub().resolves(),
    verifyRelease: stub().resolves(),
    generateNotes: stub().resolves(),
    addChannel: stub().resolves(),
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

test('Returns false if there is no relevant changes', async (t) => {
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
    branches: ['master'],
    repositoryUrl,
    verifyConditions: [stub().resolves()],
    analyzeCommits,
    verifyRelease,
    generateNotes,
    addChannel: stub().resolves(),
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

test('Exclude commits with [skip release] or [release skip] from analysis', async (t) => {
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
  const config = {branches: ['master'], repositoryUrl, globalOpt: 'global'};
  const options = {
    ...config,
    verifyConditions: [stub().resolves(), stub().resolves()],
    analyzeCommits,
    verifyRelease: stub().resolves(),
    generateNotes: stub().resolves(),
    addChannel: stub().resolves(),
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

test('Log both plugins errors and errors thrown by "fail" plugin', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  const pluginError = new SemanticReleaseError('Plugin error', 'ERR');
  const failError1 = new Error('Fail error 1');
  const failError2 = new Error('Fail error 2');

  const options = {
    branches: ['master'],
    repositoryUrl,
    verifyConditions: stub().rejects(pluginError),
    fail: [stub().rejects(failError1), stub().rejects(failError2)],
  };
  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  await t.throwsAsync(
    semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
  );

  t.is(t.context.error.args[t.context.error.args.length - 1][0], 'ERR Plugin error');
  t.is(t.context.error.args[t.context.error.args.length - 3][1], failError1);
  t.is(t.context.error.args[t.context.error.args.length - 2][1], failError2);
});

test('Call "fail" only if a plugin returns a SemanticReleaseError', async (t) => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  const pluginError = new Error('Plugin error');
  const fail = stub().resolves();

  const options = {
    branches: ['master'],
    repositoryUrl,
    verifyConditions: stub().rejects(pluginError),
    fail,
  };
  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });

  await t.throwsAsync(
    semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
  );

  t.true(fail.notCalled);
  t.is(t.context.error.args[t.context.error.args.length - 1][1], pluginError);
});

test('Throw SemanticReleaseError if repositoryUrl is not set and cannot be found from repo config', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const {cwd} = await gitRepo();

  const semanticRelease = requireNoCache('..', {
    './lib/get-logger': () => t.context.logger,
    'env-ci': () => ({isCi: true, branch: 'master', isPr: false}),
  });
  const errors = [
    ...(await t.throwsAsync(
      semanticRelease({}, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
    )),
  ];

  // Verify error code and type
  t.is(errors[0].code, 'ENOREPOURL');
  t.is(errors[0].name, 'SemanticReleaseError');
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
});

test('Throw an Error if plugin returns an unexpected value', async (t) => {
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
    branches: ['master'],
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
  const error = await t.throwsAsync(
    semanticRelease(options, {cwd, env: {}, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()}),
    {instanceOf: SemanticReleaseError}
  );
  t.regex(error.details, /string/);
});

test('Hide sensitive information passed to "fail" plugin', async (t) => {
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
  await t.throwsAsync(
    semanticRelease(options, {cwd, env, stdout: new WritableStreamBuffer(), stderr: new WritableStreamBuffer()})
  );

  const error = fail.args[0][1].errors[0];

  t.is(error.message, `Message: Exposing token ${SECRET_REPLACEMENT}`);
  t.is(error.details, `Details: Exposing token ${SECRET_REPLACEMENT}`);

  Object.getOwnPropertyNames(error).forEach((prop) => {
    if (isString(error[prop])) {
      t.notRegex(error[prop], new RegExp(escapeRegExp(env.MY_TOKEN)));
    }
  });
});

test('Hide sensitive information passed to "success" plugin', async (t) => {
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
    generateNotes: stub().resolves(`Exposing token ${env.MY_TOKEN}`),
    publish: stub().resolves({
      name: `Name: Exposing token ${env.MY_TOKEN}`,
      url: `URL: Exposing token ${env.MY_TOKEN}`,
    }),
    addChannel: false,
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

  Object.getOwnPropertyNames(release).forEach((prop) => {
    if (isString(release[prop])) {
      t.notRegex(release[prop], new RegExp(escapeRegExp(env.MY_TOKEN)));
    }
  });
});

test('Get all commits including the ones not in the shallow clone', async (t) => {
  let {cwd, repositoryUrl} = await gitRepo(true);
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitCommits(['First', 'Second', 'Third'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});

  cwd = await gitShallowClone(repositoryUrl);

  const nextRelease = {
    name: 'v2.0.0',
    type: 'major',
    version: '2.0.0',
    gitHead: await getGitHead({cwd}),
    gitTag: 'v2.0.0',
    channel: undefined,
  };
  const notes = 'Release notes';
  const analyzeCommits = stub().resolves(nextRelease.type);

  const config = {branches: ['master'], repositoryUrl, globalOpt: 'global'};
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

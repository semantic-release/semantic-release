import test from 'ava';
import proxyquire from 'proxyquire';
import {stub} from 'sinon';
import SemanticReleaseError from '@semantic-release/error';

const consoleLog = stub(console, 'log');

test.beforeEach(t => {
  // Save the current process.env
  t.context.env = Object.assign({}, process.env);
  // Save the current working diretory
  t.context.cwd = process.cwd();
});

test.afterEach.always(t => {
  // Restore the current working directory
  process.chdir(t.context.cwd);
  // Restore process.env
  process.env = Object.assign({}, t.context.env);
});

test.after.always(t => {
  consoleLog.restore();
});

test('Plugins are called with expected values', async t => {
  const env = {NPM_TOKEN: 'NPM_TOKEN'};
  const pkgOptions = {branch: 'master'};
  const cliOptions = {githubToken: 'GH_TOKEN'};
  const options = Object.assign({}, pkgOptions, cliOptions);
  const pkg = {name: 'available', release: options, repository: {url: 'http://github.com/whats/up.git'}};
  const npm = {registry: 'http://test.registry.com'};
  const lastRelease = {version: '1.0.0', gitHead: 'test_commit_head'};
  const commitsLastRelease = {version: '1.0.0', gitHead: 'tag_head'};
  const commits = [{hash: '1', message: 'fix: First fix'}, {hash: '2', message: 'feat: First feature'}];
  const nextRelease = {type: 'major', version: '2.0.0'};
  const notes = 'Release notes';

  // Stub modules
  const log = stub();
  const error = stub();
  const logger = {log, error};
  const verifyAuth = stub().returns();
  const publishNpm = stub().resolves();
  const githubRelease = stub().resolves();
  const getCommits = stub().resolves({commits, lastRelease: commitsLastRelease});
  const getNextVersion = stub().returns(nextRelease.version);
  // Stub plugins
  const verifyConditions = stub().resolves();
  const getLastRelease = stub().resolves(lastRelease);
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const getConfig = stub().resolves({
    plugins: {getLastRelease, analyzeCommits, verifyRelease, verifyConditions, generateNotes},
    env,
    options,
    pkg,
    npm,
  });

  const semanticRelease = proxyquire('../src/index', {
    './lib/logger': logger,
    './lib/verify-auth': verifyAuth,
    './lib/get-config': getConfig,
    './lib/get-commits': getCommits,
    './lib/publish-npm': publishNpm,
    './lib/github-release': githubRelease,
    './lib/get-next-version': getNextVersion,
  });

  // Call the index module
  await semanticRelease(cliOptions);

  // Verify the sub-modules have been called with expected parameters
  t.true(getConfig.calledOnce);
  t.true(getConfig.calledWithExactly(cliOptions));
  t.true(verifyAuth.calledOnce);
  t.true(verifyAuth.calledWithExactly(options, env));
  t.true(publishNpm.calledOnce);
  t.true(publishNpm.calledWithExactly(pkg, npm, nextRelease));
  t.true(githubRelease.calledOnce);
  t.true(githubRelease.calledWithExactly(pkg, notes, nextRelease.version, options));
  // Verify plugins have been called with expected parameters
  t.true(verifyConditions.calledOnce);
  t.true(verifyConditions.calledWithExactly({env, options, pkg, npm, logger}));
  t.true(getLastRelease.calledOnce);
  t.true(getLastRelease.calledWithExactly({env, options, pkg, npm, logger}));
  t.true(analyzeCommits.calledOnce);
  t.true(analyzeCommits.calledWithExactly({env, options, pkg, npm, logger, lastRelease: commitsLastRelease, commits}));
  t.true(verifyRelease.calledOnce);
  t.true(
    verifyRelease.calledWithExactly({
      env,
      options,
      pkg,
      npm,
      logger,
      lastRelease: commitsLastRelease,
      commits,
      nextRelease,
    })
  );
  t.true(generateNotes.calledOnce);
  t.true(
    generateNotes.calledWithExactly({
      env,
      options,
      pkg,
      npm,
      logger,
      lastRelease: commitsLastRelease,
      commits,
      nextRelease,
    })
  );
});

test('Dry-run skips verifyAuth, verifyConditions, publishNpm and githubRelease', async t => {
  const env = {NPM_TOKEN: 'NPM_TOKEN'};
  const pkgOptions = {branch: 'master'};
  const cliOptions = {githubToken: 'GH_TOKEN', dryRun: true};
  const options = Object.assign({}, pkgOptions, cliOptions);
  const pkg = {name: 'available', release: options, repository: {url: 'http://github.com/whats/up.git'}};
  const npm = {registry: 'http://test.registry.com'};
  const lastRelease = {version: '1.0.0', gitHead: 'test_commit_head'};
  const commitsLastRelease = {version: '1.0.0', gitHead: 'tag_head'};
  const commits = [{hash: '1', message: 'fix: First fix'}, {hash: '2', message: 'feat: First feature'}];
  const nextRelease = {type: 'major', version: '2.0.0'};
  const notes = 'Release notes';

  // Stub modules
  const log = stub();
  const error = stub();
  const logger = {log, error};
  const verifyAuth = stub().returns();
  const publishNpm = stub().resolves();
  const githubRelease = stub().resolves();
  const getCommits = stub().resolves({commits, lastRelease: commitsLastRelease});
  const getNextVersion = stub().returns(nextRelease.version);
  // Stub plugins
  const verifyConditions = stub().resolves();
  const getLastRelease = stub().resolves(lastRelease);
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves(notes);
  const getConfig = stub().resolves({
    plugins: {getLastRelease, analyzeCommits, verifyRelease, verifyConditions, generateNotes},
    env,
    options,
    pkg,
    npm,
  });

  const semanticRelease = proxyquire('../src/index', {
    './lib/logger': logger,
    './lib/verify-auth': verifyAuth,
    './lib/get-config': getConfig,
    './lib/get-commits': getCommits,
    './lib/publish-npm': publishNpm,
    './lib/github-release': githubRelease,
    './lib/get-next-version': getNextVersion,
  });

  // Call the index module
  await semanticRelease(cliOptions);

  // Verify that publishNpm, githubRelease, verifyAuth, verifyConditions have not been called in a dry run
  t.true(publishNpm.notCalled);
  t.true(githubRelease.notCalled);
  t.true(verifyAuth.notCalled);
  t.true(verifyConditions.notCalled);
  // Verify the release notes are logged
  t.true(consoleLog.calledWithMatch(notes));
  // Verify the sub-modules have been called with expected parameters
  t.true(getConfig.calledOnce);
  t.true(getConfig.calledWithExactly(cliOptions));
  // Verify plugins have been called with expected parameters
  t.true(getLastRelease.calledOnce);
  t.true(getLastRelease.calledWithExactly({env, options, pkg, npm, logger}));
  t.true(analyzeCommits.calledOnce);
  t.true(analyzeCommits.calledWithExactly({env, options, pkg, npm, logger, lastRelease: commitsLastRelease, commits}));
  t.true(verifyRelease.calledOnce);
  t.true(
    verifyRelease.calledWithExactly({
      env,
      options,
      pkg,
      npm,
      logger,
      lastRelease: commitsLastRelease,
      commits,
      nextRelease,
    })
  );
  t.true(generateNotes.calledOnce);
  t.true(
    generateNotes.calledWithExactly({
      env,
      options,
      pkg,
      npm,
      logger,
      lastRelease: commitsLastRelease,
      commits,
      nextRelease,
    })
  );
});

test('Throw SemanticReleaseError if there is no release to be done', async t => {
  const env = {NPM_TOKEN: 'NPM_TOKEN'};
  const pkgOptions = {branch: 'master'};
  const cliOptions = {githubToken: 'GH_TOKEN'};
  const options = Object.assign({}, pkgOptions, cliOptions);
  const pkg = {name: 'available', release: options, repository: {url: 'http://github.com/whats/up.git'}};
  const npm = {registry: 'http://test.registry.com'};
  const lastRelease = {version: '1.0.0', gitHead: 'test_commit_head'};
  const commitsLastRelease = {version: '1.0.0', gitHead: 'tag_head'};
  const commits = [{hash: '1', message: 'fix: First fix'}, {hash: '2', message: 'feat: First feature'}];
  const nextRelease = {type: undefined};

  // Stub modules
  const log = stub();
  const error = stub();
  const logger = {log, error};
  const verifyAuth = stub().returns();
  const publishNpm = stub().resolves();
  const githubRelease = stub().resolves();
  const getCommits = stub().resolves({commits, lastRelease: commitsLastRelease});
  const getNextVersion = stub().returns(null);
  // Stub plugins
  const verifyConditions = stub().resolves();
  const getLastRelease = stub().resolves(lastRelease);
  const analyzeCommits = stub().resolves(nextRelease.type);
  const verifyRelease = stub().resolves();
  const generateNotes = stub().resolves();
  const getConfig = stub().resolves({
    plugins: {getLastRelease, analyzeCommits, verifyRelease, verifyConditions, generateNotes},
    env,
    options,
    pkg,
    npm,
  });

  const semanticRelease = proxyquire('../src/index', {
    './lib/logger': logger,
    './lib/verify-auth': verifyAuth,
    './lib/get-config': getConfig,
    './lib/get-commits': getCommits,
    './lib/publish-npm': publishNpm,
    './lib/github-release': githubRelease,
    './lib/get-next-version': getNextVersion,
  });

  // Call the index module
  const err = await t.throws(semanticRelease(cliOptions));
  // Verify error code and type
  t.is(err.code, 'ENOCHANGE');
  t.true(err instanceof SemanticReleaseError);
  // Verify the sub-modules have been called with expected parameters
  t.true(getConfig.calledOnce);
  t.true(getConfig.calledWithExactly(cliOptions));
  t.true(verifyAuth.calledOnce);
  t.true(verifyAuth.calledWithExactly(options, env));
  // Verify plugins have been called with expected parameters
  t.true(verifyConditions.calledOnce);
  t.true(verifyConditions.calledWithExactly({env, options, pkg, npm, logger}));
  t.true(getLastRelease.calledOnce);
  t.true(getLastRelease.calledWithExactly({env, options, pkg, npm, logger}));
  t.true(analyzeCommits.calledOnce);
  t.true(analyzeCommits.calledWithExactly({env, options, pkg, npm, logger, lastRelease: commitsLastRelease, commits}));
  // Verify that verifyRelease, publishNpm, generateNotes, githubRelease have not been called when no release is done
  t.true(verifyRelease.notCalled);
  t.true(generateNotes.notCalled);
  t.true(publishNpm.notCalled);
  t.true(githubRelease.notCalled);
});

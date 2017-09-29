import {callbackify} from 'util';
import test from 'ava';
import {gitRepo, gitCommits} from './helpers/git-utils';
import proxyquire from 'proxyquire';
import {stub} from 'sinon';

// Stub to capture the log messages
const errorLog = stub();
// Module to test
const pre = proxyquire('../src/pre', {
  './lib/get-commits': proxyquire('../src/lib/get-commits', {npmlog: {error: errorLog}}),
});

test.beforeEach(t => {
  // Save the current working diretory
  t.context.cwd = process.cwd();
  // Reset the stub call history
  errorLog.resetHistory();
});

test.afterEach.always(t => {
  // Restore the current working directory
  process.chdir(t.context.cwd);
});

test.serial('Increase version', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const cmts = await gitCommits(['fix: First fix', 'feat: Second feature']);

  const options = {branch: 'master'};
  const pkg = {name: 'available'};
  const lastRelease = {version: '1.0.0', gitHead: cmts[cmts.length - 1].hash};
  // Stub the getLastRelease, analyzeCommits and verifyRelease plugins
  const getLastRelease = stub().resolves(lastRelease);
  const analyzeCommits = stub().resolves('major');
  const verifyRelease = stub().resolves();

  // Call the pre module
  const nextRelease = await pre({
    options,
    pkg,
    plugins: {
      getLastRelease: callbackify(getLastRelease),
      analyzeCommits: callbackify(analyzeCommits),
      verifyRelease: callbackify(verifyRelease),
    },
  });

  // Verify the pre module returns the 'type' returned by analyzeCommits and the 'version' returned by getLastRelease increamented with the 'type' (current version 1.0.0 => major release = version 2.0.0)
  t.deepEqual(nextRelease, {type: 'major', version: '2.0.0'});

  // Verify the getLastRelease plugin has been called with 'options' and 'pkg'
  t.true(getLastRelease.calledOnce);
  t.deepEqual(getLastRelease.firstCall.args[0].options, options);
  t.deepEqual(getLastRelease.firstCall.args[0].pkg, pkg);

  // Verify the analyzeCommits plugin has been called with the repo 'commits' since lastVersion githead
  t.true(analyzeCommits.calledOnce);
  t.is(analyzeCommits.firstCall.args[0].commits.length, 1);
  t.is(analyzeCommits.firstCall.args[0].commits[0].hash.substring(0, 7), cmts[0].hash);
  t.is(analyzeCommits.firstCall.args[0].commits[0].message, cmts[0].message);

  // Verify the verifyRelease plugin has been called with 'lastRelease' and 'nextRelease'
  t.true(verifyRelease.calledOnce);
  t.deepEqual(verifyRelease.firstCall.args[0].lastRelease, lastRelease);
  t.deepEqual(verifyRelease.firstCall.args[0].nextRelease, nextRelease);
});

test.serial('Initial version', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const cmts = await gitCommits(['fix(scope1): First fix', 'feat(scope2): Second feature']);

  const options = {branch: 'master'};
  const pkg = {name: 'available'};
  const lastRelease = {version: null, gitHead: undefined};
  // Stub the getLastRelease, analyzeCommits and verifyRelease plugins
  const getLastRelease = stub().resolves({version: null, gitHead: undefined});
  const analyzeCommits = stub().resolves('major');
  const verifyRelease = stub().resolves();

  // Call the pre module
  const nextRelease = await pre({
    options,
    pkg,
    plugins: {
      getLastRelease: callbackify(getLastRelease),
      analyzeCommits: callbackify(analyzeCommits),
      verifyRelease: callbackify(verifyRelease),
    },
  });

  // Verify the pre module returns the 'type' returned by analyzeCommits and the 'version' returned by getLastRelease increamented with the 'type' (no current version => initial release = version 1.0.0)
  t.deepEqual(nextRelease, {type: 'initial', version: '1.0.0'});

  // Verify the getLastRelease plugin has been called with 'options' and 'pkg'
  t.true(getLastRelease.calledOnce);
  t.deepEqual(getLastRelease.firstCall.args[0].options, options);
  t.deepEqual(getLastRelease.firstCall.args[0].pkg, pkg);

  // Verify the analyzeCommits plugin has been called with all the repo 'commits'
  t.true(analyzeCommits.calledOnce);
  t.is(analyzeCommits.firstCall.args[0].commits.length, 2);
  t.is(analyzeCommits.firstCall.args[0].commits[0].hash.substring(0, 7), cmts[0].hash);
  t.is(analyzeCommits.firstCall.args[0].commits[0].message, cmts[0].message);
  t.is(analyzeCommits.firstCall.args[0].commits[1].hash.substring(0, 7), cmts[1].hash);
  t.is(analyzeCommits.firstCall.args[0].commits[1].message, cmts[1].message);

  // Verify the verifyRelease plugin has been called with 'lastRelease' and 'nextRelease'
  t.true(verifyRelease.calledOnce);
  t.deepEqual(verifyRelease.firstCall.args[0].lastRelease, lastRelease);
  t.deepEqual(verifyRelease.firstCall.args[0].nextRelease, nextRelease);
});

test.serial('Throws error if verifyRelease fails', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const cmts = await gitCommits(['fix: First fix', 'feat: Second feature']);

  const options = {branch: 'master'};
  const pkg = {name: 'available'};
  const lastRelease = {version: '1.0.0', gitHead: cmts[cmts.length - 1].hash};
  // Stub the getLastRelease, analyzeCommits and verifyRelease plugins
  const getLastRelease = stub().resolves(lastRelease);
  const analyzeCommits = stub().resolves('major');
  const verifyRelease = stub().rejects(new Error('verifyRelease failed'));

  // Call the pre module and verify it returns the Error returned by verifyRelease
  const error = await t.throws(
    pre({
      options,
      pkg,
      plugins: {
        getLastRelease: callbackify(getLastRelease),
        analyzeCommits: callbackify(analyzeCommits),
        verifyRelease: callbackify(verifyRelease),
      },
    })
  );

  // Verify the error message is the one returned by verifyRelease
  t.is(error.message, 'verifyRelease failed');

  // Verify the getLastRelease plugin has been called with 'options' and 'pkg'
  t.true(getLastRelease.calledOnce);
  t.deepEqual(getLastRelease.firstCall.args[0].options, options);
  t.deepEqual(getLastRelease.firstCall.args[0].pkg, pkg);

  // Verify the analyzeCommits plugin has been called with all the repo 'commits'
  t.true(analyzeCommits.calledOnce);
  t.is(analyzeCommits.firstCall.args[0].commits.length, 1);
  t.is(analyzeCommits.firstCall.args[0].commits[0].hash.substring(0, 7), cmts[0].hash);
  t.is(analyzeCommits.firstCall.args[0].commits[0].message, cmts[0].message);

  // Verify the verifyRelease plugin has been called with 'lastRelease' and 'nextRelease'
  t.true(verifyRelease.calledOnce);
  t.deepEqual(verifyRelease.firstCall.args[0].lastRelease, lastRelease);
  t.deepEqual(verifyRelease.firstCall.args[0].nextRelease, {type: 'major', version: '2.0.0'});
});

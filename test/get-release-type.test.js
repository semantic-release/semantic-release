import {callbackify} from 'util';
import test from 'ava';
import {stub} from 'sinon';
import SemanticReleaseError from '@semantic-release/error';
import getReleaseType from '../src/lib/get-release-type';

test('Get commit types from commits', async t => {
  // Stub the commitAnalyzer plugin, returns 'major' release type
  const analyzeCommits = stub().resolves('major');
  const commits = [{hash: '0', message: 'a'}];

  // Call the get-release-type module
  const releaseType = await getReleaseType({
    commits,
    lastRelease: {version: '1.0.0'},
    plugins: {analyzeCommits: callbackify(analyzeCommits)},
  });

  // Verify the module return the release type obtain from the commitAnalyzer plugin
  t.is(releaseType, 'major');

  // Verify the commitAnalyzer plugin was called with the commits
  t.true(analyzeCommits.calledOnce);
  t.deepEqual(analyzeCommits.firstCall.args[0].commits, commits);
});

test('Throws error when no changes', async t => {
  // Stub the commitAnalyzer plugin, returns 'null' release type
  const analyzeCommits = stub().resolves(null);
  const commits = [{hash: '0', message: 'a'}];

  // Call the get-release-type module and verify it returns an error
  const error = await t.throws(
    getReleaseType({
      commits,
      lastRelease: {version: '1.0.0'},
      plugins: {analyzeCommits: callbackify(analyzeCommits)},
    })
  );

  // Verify the error code adn type
  t.is(error.code, 'ENOCHANGE');
  t.true(error instanceof SemanticReleaseError);

  // Verify the commitAnalyzer plugin was called with the commits
  t.true(analyzeCommits.calledOnce);
  t.deepEqual(analyzeCommits.firstCall.args[0].commits, commits);
});

test('Return initial if there is no lastRelease', async t => {
  // Stub the commitAnalyzer plugin, returns 'major' release type
  const analyzeCommits = stub().resolves('major');
  const commits = [{hash: '0', message: 'a'}];

  // Call the get-release-type module
  const releaseType = await getReleaseType({
    commits,
    lastRelease: {},
    plugins: {analyzeCommits: callbackify(analyzeCommits)},
  });

  // Verify the module return an initial release type
  t.is(releaseType, 'initial');

  // Verify the commitAnalyzer plugin was called with the commits
  t.true(analyzeCommits.calledOnce);
  t.deepEqual(analyzeCommits.firstCall.args[0].commits, commits);
});

test('Throws error when no changes even if there is no lastRelease', async t => {
  // Stub the commitAnalyzer plugin, returns 'null' release type
  const analyzeCommits = stub().resolves(null);
  const commits = [{hash: '0', message: 'a'}];

  // Call the get-release-type module and verify it returns an error
  const error = await t.throws(
    getReleaseType({commits, lastRelease: {}, plugins: {analyzeCommits: callbackify(analyzeCommits)}})
  );

  // Verify the error code adn type
  t.is(error.code, 'ENOCHANGE');
  t.true(error instanceof SemanticReleaseError);

  // Verify the commitAnalyzer plugin was called with the commits
  t.true(analyzeCommits.calledOnce);
  t.deepEqual(analyzeCommits.firstCall.args[0].commits, commits);
});

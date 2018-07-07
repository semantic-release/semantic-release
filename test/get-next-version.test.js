import test from 'ava';
import {stub} from 'sinon';
import getNextVersion from '../lib/get-next-version';

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Increase version for patch release', t => {
  t.is(
    getNextVersion({
      branch: {name: 'master', type: 'release'},
      nextRelease: {type: 'patch'},
      lastRelease: {version: '1.0.0'},
      logger: t.context.logger,
    }),
    '1.0.1'
  );
});

test('Increase version for minor release', t => {
  t.is(
    getNextVersion({
      branch: {name: 'master', type: 'release'},
      nextRelease: {type: 'minor'},
      lastRelease: {version: '1.0.0'},
      logger: t.context.logger,
    }),
    '1.1.0'
  );
});

test('Increase version for major release', t => {
  t.is(
    getNextVersion({
      branch: {name: 'master', type: 'release'},
      nextRelease: {type: 'major'},
      lastRelease: {version: '1.0.0'},
      logger: t.context.logger,
    }),
    '2.0.0'
  );
});

test('Return 1.0.0 if there is no previous release', t => {
  t.is(
    getNextVersion({
      branch: {name: 'master', type: 'release'},
      nextRelease: {type: 'minor'},
      lastRelease: {},
      logger: t.context.logger,
    }),
    '1.0.0'
  );
});

test('Increase version for patch release on prerelease branch', t => {
  t.is(
    getNextVersion({
      branch: {name: 'beta', type: 'prerelease', prerelease: 'beta'},
      nextRelease: {type: 'patch'},
      lastRelease: {version: '1.0.0'},
      logger: t.context.logger,
    }),
    '1.0.1-beta.1'
  );

  t.is(
    getNextVersion({
      branch: {name: 'beta', type: 'prerelease', prerelease: 'beta'},
      nextRelease: {type: 'patch'},
      lastRelease: {version: '1.0.0-beta.1'},
      logger: t.context.logger,
    }),
    '1.0.0-beta.2'
  );
});

test('Increase version for minor release on prerelease branch', t => {
  t.is(
    getNextVersion({
      branch: {name: 'beta', type: 'prerelease', prerelease: 'beta'},
      nextRelease: {type: 'minor'},
      lastRelease: {version: '1.0.0'},
      logger: t.context.logger,
    }),
    '1.1.0-beta.1'
  );

  t.is(
    getNextVersion({
      branch: {name: 'beta', type: 'prerelease', prerelease: 'beta'},
      nextRelease: {type: 'minor'},
      lastRelease: {version: '1.0.0-beta.1'},
      logger: t.context.logger,
    }),
    '1.0.0-beta.2'
  );
});

test('Increase version for major release on prerelease branch', t => {
  t.is(
    getNextVersion({
      branch: {name: 'beta', type: 'prerelease', prerelease: 'beta'},
      nextRelease: {type: 'major'},
      lastRelease: {version: '1.0.0'},
      logger: t.context.logger,
    }),
    '2.0.0-beta.1'
  );

  t.is(
    getNextVersion({
      branch: {name: 'beta', type: 'prerelease', prerelease: 'beta'},
      nextRelease: {type: 'major'},
      lastRelease: {version: '1.0.0-beta.1'},
      logger: t.context.logger,
    }),
    '1.0.0-beta.2'
  );
});

test('Return 1.0.0 if there is no previous release on prerelease branch', t => {
  t.is(
    getNextVersion({
      branch: {name: 'beta', type: 'prerelease', prerelease: 'beta'},
      nextRelease: {type: 'minor'},
      lastRelease: {},
      logger: t.context.logger,
    }),
    '1.0.0-beta.1'
  );
});

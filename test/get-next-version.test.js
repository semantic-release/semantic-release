const test = require('ava');
const {stub} = require('sinon');
const getNextVersion = require('../lib/get-next-version');

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Increase version for patch release', t => {
  t.is(
    getNextVersion({
      branch: {name: 'master', type: 'release', tags: [{gitTag: 'v1.0.0', version: '1.0.0', channels: [null]}]},
      nextRelease: {type: 'patch'},
      lastRelease: {version: '1.0.0', channels: [null]},
      logger: t.context.logger,
    }),
    '1.0.1'
  );
});

test('Increase version for minor release', t => {
  t.is(
    getNextVersion({
      branch: {name: 'master', type: 'release', tags: [{gitTag: 'v1.0.0', version: '1.0.0', channels: [null]}]},
      nextRelease: {type: 'minor'},
      lastRelease: {version: '1.0.0', channels: [null]},
      logger: t.context.logger,
    }),
    '1.1.0'
  );
});

test('Increase version for major release', t => {
  t.is(
    getNextVersion({
      branch: {name: 'master', type: 'release', tags: [{gitTag: 'v1.0.0', version: '1.0.0', channels: [null]}]},
      nextRelease: {type: 'major'},
      lastRelease: {version: '1.0.0', channels: [null]},
      logger: t.context.logger,
    }),
    '2.0.0'
  );
});

test('Return 1.0.0 if there is no previous release', t => {
  t.is(
    getNextVersion({
      branch: {name: 'master', type: 'release', tags: []},
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
      branch: {
        name: 'beta',
        type: 'prerelease',
        prerelease: 'beta',
        tags: [{gitTag: 'v1.0.0', version: '1.0.0', channels: [null]}],
      },
      nextRelease: {type: 'patch', channel: 'beta'},
      lastRelease: {version: '1.0.0', channels: [null]},
      logger: t.context.logger,
    }),
    '1.0.1-beta.1'
  );

  t.is(
    getNextVersion({
      branch: {
        name: 'beta',
        type: 'prerelease',
        prerelease: 'beta',
        tags: [
          {gitTag: 'v1.0.0', version: '1.0.0', channels: [null]},
          {gitTag: 'v1.0.1-beta.1', version: '1.0.1-beta.1', channels: ['beta']},
        ],
      },
      nextRelease: {type: 'patch', channel: 'beta'},
      lastRelease: {version: '1.0.1-beta.1', channels: ['beta']},
      logger: t.context.logger,
    }),
    '1.0.1-beta.2'
  );

  t.is(
    getNextVersion({
      branch: {
        name: 'alpha',
        type: 'prerelease',
        prerelease: 'alpha',
        tags: [{gitTag: 'v1.0.1-beta.1', version: '1.0.1-beta.1', channels: ['beta']}],
      },
      nextRelease: {type: 'patch', channel: 'alpha'},
      lastRelease: {version: '1.0.1-beta.1', channels: ['beta']},
      logger: t.context.logger,
    }),
    '1.0.2-alpha.1'
  );
});

test('Increase version for minor release on prerelease branch', t => {
  t.is(
    getNextVersion({
      branch: {
        name: 'beta',
        type: 'prerelease',
        prerelease: 'beta',
        tags: [{gitTag: 'v1.0.0', version: '1.0.0', channels: [null]}],
      },
      nextRelease: {type: 'minor', channel: 'beta'},
      lastRelease: {version: '1.0.0', channels: [null]},
      logger: t.context.logger,
    }),
    '1.1.0-beta.1'
  );

  t.is(
    getNextVersion({
      branch: {
        name: 'beta',
        type: 'prerelease',
        prerelease: 'beta',
        tags: [
          {gitTag: 'v1.0.0', version: '1.0.0', channels: [null]},
          {gitTag: 'v1.1.0-beta.1', version: '1.1.0-beta.1', channels: ['beta']},
        ],
      },
      nextRelease: {type: 'minor', channel: 'beta'},
      lastRelease: {version: '1.1.0-beta.1', channels: ['beta']},
      logger: t.context.logger,
    }),
    '1.1.0-beta.2'
  );

  t.is(
    getNextVersion({
      branch: {
        name: 'alpha',
        type: 'prerelease',
        prerelease: 'alpha',
        tags: [{gitTag: 'v1.1.0-beta.1', version: '1.1.0-beta.1', channels: ['beta']}],
      },
      nextRelease: {type: 'minor', channel: 'alpha'},
      lastRelease: {version: '1.1.0-beta.1', channels: ['beta']},
      logger: t.context.logger,
    }),
    '1.2.0-alpha.1'
  );
});

test('Increase version for major release on prerelease branch', t => {
  t.is(
    getNextVersion({
      branch: {
        name: 'beta',
        type: 'prerelease',
        prerelease: 'beta',
        tags: [{gitTag: 'v1.0.0', version: '1.0.0', channels: [null]}],
      },
      nextRelease: {type: 'major', channel: 'beta'},
      lastRelease: {version: '1.0.0', channels: [null]},
      logger: t.context.logger,
    }),
    '2.0.0-beta.1'
  );

  t.is(
    getNextVersion({
      branch: {
        name: 'beta',
        type: 'prerelease',
        prerelease: 'beta',
        tags: [
          {gitTag: 'v1.0.0', version: '1.0.0', channels: [null]},
          {gitTag: 'v2.0.0-beta.1', version: '2.0.0-beta.1', channels: ['beta']},
        ],
      },
      nextRelease: {type: 'major', channel: 'beta'},
      lastRelease: {version: '2.0.0-beta.1', channels: ['beta']},
      logger: t.context.logger,
    }),
    '2.0.0-beta.2'
  );

  t.is(
    getNextVersion({
      branch: {
        name: 'alpha',
        type: 'prerelease',
        prerelease: 'alpha',
        tags: [{gitTag: 'v2.0.0-beta.1', version: '2.0.0-beta.1', channels: ['beta']}],
      },
      nextRelease: {type: 'major', channel: 'alpha'},
      lastRelease: {version: '2.0.0-beta.1', channels: ['beta']},
      logger: t.context.logger,
    }),
    '3.0.0-alpha.1'
  );
});

test('Return 1.0.0 if there is no previous release on prerelease branch', t => {
  t.is(
    getNextVersion({
      branch: {name: 'beta', type: 'prerelease', prerelease: 'beta', tags: []},
      nextRelease: {type: 'minor'},
      lastRelease: {},
      logger: t.context.logger,
    }),
    '1.0.0-beta.1'
  );
});

test('Increase version for release on prerelease branch after previous commits were merged to release branch', t => {
  t.is(
    getNextVersion({
      branch: {
        name: 'beta',
        type: 'prerelease',
        prerelease: 'beta',
        tags: [
          {gitTag: 'v1.0.0', version: '1.0.0', channels: [null]},
          {gitTag: 'v1.1.0', version: '1.1.0', channels: [null]}, // Version v1.1.0 released on default branch after beta was merged into master
          {gitTag: 'v1.1.0-beta.1', version: '1.1.0-beta.1', channels: [null, 'beta']},
        ],
      },
      nextRelease: {type: 'minor'},
      lastRelease: {version: '1.1.0', channels: [null]},
      logger: t.context.logger,
    }),
    '1.2.0-beta.1'
  );
});

test('Increase version for release on prerelease branch based on highest commit type since last regular release', t => {
  t.is(
    getNextVersion({
      branch: {
        name: 'beta',
        type: 'prerelease',
        prerelease: 'beta',
        tags: [
          {gitTag: 'v1.0.0', version: '1.0.0', channels: [null]},
          {gitTag: 'v1.1.0-beta.1', version: '1.1.0-beta.1', channels: [null, 'beta']},
        ],
      },
      nextRelease: {type: 'major'},
      lastRelease: {version: 'v1.1.0-beta.1', channels: [null]},
      logger: t.context.logger,
    }),
    '2.0.0-beta.1'
  );
});

test('Increase version for release on prerelease branch when there is no regular releases on other branches', t => {
  t.is(
    getNextVersion({
      branch: {
        name: 'beta',
        type: 'prerelease',
        prerelease: 'beta',
        tags: [{gitTag: 'v1.0.0-beta.1', version: '1.0.0-beta.1', channels: ['beta']}],
      },
      nextRelease: {type: 'minor', channel: 'beta'},
      lastRelease: {version: 'v1.0.0-beta.1', channels: ['beta']},
      logger: t.context.logger,
    }),
    '1.0.0-beta.2'
  );
});

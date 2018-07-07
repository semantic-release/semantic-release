import test from 'ava';
import {stub} from 'sinon';
import getLastRelease from '../lib/get-last-release';

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Get the highest non-prerelease valid tag', t => {
  const result = getLastRelease({
    branch: {
      name: 'master',
      tags: [
        {version: '2.0.0', gitTag: 'v2.0.0', gitHead: '222'},
        {version: '1.0.0', gitTag: 'v1.0.0', gitHead: '111'},
        {version: '3.0.0-beta.1', gitTag: 'v3.0.0-beta.1@beta', gitHead: '333'},
      ],
      type: 'release',
    },
    options: {tagFormat: `v\${version}`},
    logger: t.context.logger,
  });

  t.deepEqual(result, {version: '2.0.0', gitTag: 'v2.0.0', name: 'v2.0.0', gitHead: '222', channel: undefined});
  t.deepEqual(t.context.log.args[0][0], 'Found git tag v2.0.0 associated with version 2.0.0 on branch master');
});

test('Return empty object if no valid tag is found', t => {
  const result = getLastRelease({
    branch: {
      name: 'master',
      tags: [{version: '3.0.0-beta.1', gitTag: 'v3.0.0-beta.1@beta', gitHead: '111'}],
      type: 'release',
    },
    options: {tagFormat: `v\${version}`},
    logger: t.context.logger,
  });

  t.deepEqual(result, {});
  t.deepEqual(t.context.log.args[0][0], 'No git tag version found on branch master');
});

test('Get the highest non-prerelease valid tag before a certain version', t => {
  const result = getLastRelease(
    {
      branch: {
        name: 'master',
        channel: undefined,
        tags: [
          {version: '2.0.0', gitTag: 'v2.0.0', gitHead: '333'},
          {version: '1.0.0', gitTag: 'v1.0.0', gitHead: '111'},
          {version: '2.0.0-beta.1', gitTag: 'v2.0.0-beta.1@beta', gitHead: '222'},
          {version: '2.1.0', gitTag: 'v2.1.0', gitHead: '444'},
          {version: '2.1.1', gitTag: 'v2.1.1', gitHead: '555'},
        ],
        type: 'release',
      },
      options: {tagFormat: `v\${version}`},
      logger: t.context.logger,
    },
    {before: '2.1.0'}
  );

  t.deepEqual(result, {version: '2.0.0', gitTag: 'v2.0.0', name: 'v2.0.0', gitHead: '333', channel: undefined});
  t.deepEqual(t.context.log.args[0][0], 'Found git tag v2.0.0 associated with version 2.0.0 on branch master');
});

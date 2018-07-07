import test from 'ava';
import {stub} from 'sinon';
import getReleasesToAdd from '../lib/get-releases-to-add';

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Return versions merged from release to maintenance branch', t => {
  const result = getReleasesToAdd({
    branch: {
      name: '1.x',
      channel: '1.x',
      tags: [
        {gitTag: 'v1.0.0@1.x', version: '1.0.0', channel: '1.x', gitHead: '111'},
        {gitTag: 'v1.0.0', version: '1.0.0', gitHead: '111'},
        {gitTag: 'v1.1.0', version: '1.1.0', gitHead: '222'},
        {gitTag: 'v1.1.1', version: '1.1.1', gitHead: '333'},
      ],
    },
    branches: [{name: '1.x', channel: '1.x'}, {name: 'master'}],
    options: {tagFormat: `v\${version}`},
    logger: t.context.logger,
  });

  t.deepEqual(result, [
    {
      lastRelease: {version: '1.0.0', channel: '1.x', gitTag: 'v1.0.0@1.x', name: 'v1.0.0', gitHead: '111'},
      currentRelease: {
        type: 'minor',
        version: '1.1.0',
        channel: undefined,
        gitTag: 'v1.1.0',
        name: 'v1.1.0',
        gitHead: '222',
      },
      nextRelease: {
        type: 'minor',
        version: '1.1.0',
        channel: '1.x',
        gitTag: 'v1.1.0@1.x',
        name: 'v1.1.0',
        gitHead: '222',
      },
    },
    {
      lastRelease: {version: '1.1.0', channel: undefined, gitTag: 'v1.1.0', name: 'v1.1.0', gitHead: '222'},
      currentRelease: {
        type: 'patch',
        version: '1.1.1',
        channel: undefined,
        gitTag: 'v1.1.1',
        name: 'v1.1.1',
        gitHead: '333',
      },
      nextRelease: {
        type: 'patch',
        version: '1.1.1',
        channel: '1.x',
        gitTag: 'v1.1.1@1.x',
        name: 'v1.1.1',
        gitHead: '333',
      },
    },
  ]);
});

test('Return versions merged from future branch to release branch', t => {
  const result = getReleasesToAdd({
    branch: {
      name: 'master',
      tags: [
        {gitTag: 'v1.0.0', version: '1.0.0', gitHead: '111'},
        {gitTag: 'v1.0.0@next', version: '1.0.0', channel: 'next', gitHead: '111'},
        {gitTag: 'v1.1.0@next', version: '1.1.0', channel: 'next', gitHead: '222'},
        {gitTag: 'v2.0.0@next-major', version: '2.0.0', channel: 'next-major', gitHead: '333'},
      ],
    },
    branches: [{name: 'master'}, {name: 'next', channel: 'next'}, {name: 'next-major', channel: 'next-major'}],
    options: {tagFormat: `v\${version}`},
    logger: t.context.logger,
  });

  t.deepEqual(result, [
    {
      lastRelease: {version: '1.0.0', channel: undefined, gitTag: 'v1.0.0', name: 'v1.0.0', gitHead: '111'},
      currentRelease: {
        type: 'minor',
        version: '1.1.0',
        channel: 'next',
        gitTag: 'v1.1.0@next',
        name: 'v1.1.0',
        gitHead: '222',
      },
      nextRelease: {
        type: 'minor',
        version: '1.1.0',
        channel: undefined,
        gitTag: 'v1.1.0',
        name: 'v1.1.0',
        gitHead: '222',
      },
    },
    {
      lastRelease: {version: '1.1.0', gitTag: 'v1.1.0@next', name: 'v1.1.0', gitHead: '222', channel: 'next'},
      currentRelease: {
        type: 'major',
        version: '2.0.0',
        channel: 'next-major',
        gitTag: 'v2.0.0@next-major',
        name: 'v2.0.0',
        gitHead: '333',
      },
      nextRelease: {
        type: 'major',
        version: '2.0.0',
        channel: undefined,
        gitTag: 'v2.0.0',
        name: 'v2.0.0',
        gitHead: '333',
      },
    },
  ]);
});

test('Return releases sorted by ascending order', t => {
  const result = getReleasesToAdd({
    branch: {
      name: 'master',
      tags: [
        {gitTag: 'v2.0.0@next-major', version: '2.0.0', channel: 'next-major', gitHead: '333'},
        {gitTag: 'v1.1.0@next', version: '1.1.0', channel: 'next', gitHead: '222'},
        {gitTag: 'v1.0.0', version: '1.0.0', gitHead: '111'},
        {gitTag: 'v1.0.0@next', version: '1.0.0', channel: 'next', gitHead: '111'},
      ],
    },
    branches: [{name: 'master'}, {name: 'next', channel: 'next'}, {name: 'next-major', channel: 'next-major'}],
    options: {tagFormat: `v\${version}`},
    logger: t.context.logger,
  });

  t.deepEqual(result, [
    {
      lastRelease: {version: '1.0.0', channel: undefined, gitTag: 'v1.0.0', name: 'v1.0.0', gitHead: '111'},
      currentRelease: {
        type: 'minor',
        version: '1.1.0',
        channel: 'next',
        gitTag: 'v1.1.0@next',
        name: 'v1.1.0',
        gitHead: '222',
      },
      nextRelease: {
        type: 'minor',
        version: '1.1.0',
        channel: undefined,
        gitTag: 'v1.1.0',
        name: 'v1.1.0',
        gitHead: '222',
      },
    },
    {
      lastRelease: {version: '1.1.0', gitTag: 'v1.1.0@next', name: 'v1.1.0', gitHead: '222', channel: 'next'},
      currentRelease: {
        type: 'major',
        version: '2.0.0',
        channel: 'next-major',
        gitTag: 'v2.0.0@next-major',
        name: 'v2.0.0',
        gitHead: '333',
      },
      nextRelease: {
        type: 'major',
        version: '2.0.0',
        channel: undefined,
        gitTag: 'v2.0.0',
        name: 'v2.0.0',
        gitHead: '333',
      },
    },
  ]);
});

test('no lastRelease', t => {
  const result = getReleasesToAdd({
    branch: {name: 'master', tags: [{gitTag: 'v1.0.0@next', version: '1.0.0', channel: 'next', gitHead: '111'}]},
    branches: [{name: 'master'}, {name: 'next', channel: 'next'}],
    options: {tagFormat: `v\${version}`},
    logger: t.context.logger,
  });

  t.deepEqual(result, [
    {
      lastRelease: {},
      currentRelease: {
        type: 'major',
        version: '1.0.0',
        channel: 'next',
        gitTag: 'v1.0.0@next',
        name: 'v1.0.0',
        gitHead: '111',
      },
      nextRelease: {
        type: 'major',
        version: '1.0.0',
        channel: undefined,
        gitTag: 'v1.0.0',
        name: 'v1.0.0',
        gitHead: '111',
      },
    },
  ]);
});

test('Ignore pre-release versions', t => {
  const result = getReleasesToAdd({
    branch: {
      name: 'master',
      tags: [
        {gitTag: 'v1.0.0', version: '1.0.0', gitHead: '111'},
        {gitTag: 'v1.0.0@next', version: '1.0.0', channel: 'next', gitHead: '111'},
        {gitTag: 'v1.1.0@next', version: '1.1.0', channel: 'next', gitHead: '222'},
        {gitTag: 'v2.0.0-alpha.1@alpha', version: '2.0.0', channel: 'alpha', gitHead: '333'},
      ],
    },
    branches: [
      {name: 'master'},
      {name: 'next', channel: 'next'},
      {name: 'alpha', type: 'prerelease', channel: 'alpha'},
    ],
    options: {tagFormat: `v\${version}`},
    logger: t.context.logger,
  });

  t.deepEqual(result, [
    {
      lastRelease: {version: '1.0.0', channel: undefined, gitTag: 'v1.0.0', name: 'v1.0.0', gitHead: '111'},
      currentRelease: {
        type: 'minor',
        version: '1.1.0',
        channel: 'next',
        gitTag: 'v1.1.0@next',
        name: 'v1.1.0',
        gitHead: '222',
      },
      nextRelease: {
        type: 'minor',
        version: '1.1.0',
        channel: undefined,
        gitTag: 'v1.1.0',
        name: 'v1.1.0',
        gitHead: '222',
      },
    },
  ]);
});

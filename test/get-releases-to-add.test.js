import test from 'ava';
import getReleasesToAdd from '../lib/get-releases-to-add';

test('Return versions merged from release to maintenance branch, excluding lower than branch start range', t => {
  const result = getReleasesToAdd({
    branch: {
      name: '2.x',
      channel: '2.x',
      type: 'maintenance',
      mergeRange: '>=2.0.0 <3.0.0',
      tags: [
        {gitTag: 'v2.0.0@2.x', version: '2.0.0', channel: '2.x', gitHead: '111'},
        {gitTag: 'v2.0.0', version: '2.0.0', gitHead: '111'},
        {gitTag: 'v2.1.0', version: '2.1.0', gitHead: '222'},
        {gitTag: 'v2.1.1', version: '2.1.1', gitHead: '333'},
        {gitTag: 'v1.0.0', version: '1.0.0', gitHead: '444'},
        {gitTag: 'v1.1.0', version: '1.1.0', gitHead: '555'},
      ],
    },
    branches: [{name: '2.x', channel: '2.x'}, {name: 'master'}],
    options: {tagFormat: `v\${version}`},
  });

  t.deepEqual(result, [
    {
      lastRelease: {version: '2.0.0', channel: '2.x', gitTag: 'v2.0.0@2.x', name: 'v2.0.0', gitHead: '111'},
      currentRelease: {
        type: 'minor',
        version: '2.1.0',
        channel: undefined,
        gitTag: 'v2.1.0',
        name: 'v2.1.0',
        gitHead: '222',
      },
      nextRelease: {
        type: 'minor',
        version: '2.1.0',
        channel: '2.x',
        gitTag: 'v2.1.0@2.x',
        name: 'v2.1.0',
        gitHead: '222',
      },
    },
    {
      lastRelease: {version: '2.1.0', channel: undefined, gitTag: 'v2.1.0', name: 'v2.1.0', gitHead: '222'},
      currentRelease: {
        type: 'patch',
        version: '2.1.1',
        channel: undefined,
        gitTag: 'v2.1.1',
        name: 'v2.1.1',
        gitHead: '333',
      },
      nextRelease: {
        type: 'patch',
        version: '2.1.1',
        channel: '2.x',
        gitTag: 'v2.1.1@2.x',
        name: 'v2.1.1',
        gitHead: '333',
      },
    },
  ]);
});

test('Return versions merged between release branches', t => {
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

test('No lastRelease', t => {
  const result = getReleasesToAdd({
    branch: {name: 'master', tags: [{gitTag: 'v1.0.0@next', version: '1.0.0', channel: 'next', gitHead: '111'}]},
    branches: [{name: 'master'}, {name: 'next', channel: 'next'}],
    options: {tagFormat: `v\${version}`},
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

test('Exclude versions merged from release to maintenance branch if they have the same "channel"', t => {
  const result = getReleasesToAdd({
    branch: {
      name: '2.x',
      channel: 'latest',
      type: 'maintenance',
      mergeRange: '>=2.0.0 <3.0.0',
      tags: [
        {gitTag: 'v2.0.0', version: '2.0.0', gitHead: '111'},
        {gitTag: 'v2.0.0', version: '2.0.0', gitHead: '111'},
        {gitTag: 'v2.1.0', version: '2.1.0', gitHead: '222'},
        {gitTag: 'v2.1.1', version: '2.1.1', gitHead: '333'},
        {gitTag: 'v1.0.0', version: '1.0.0', gitHead: '444'},
        {gitTag: 'v1.1.0', version: '1.1.0', gitHead: '555'},
      ],
    },
    branches: [{name: '2.x', channel: 'latest'}, {name: 'master', channel: 'latest'}],
    options: {tagFormat: `v\${version}`},
  });

  t.deepEqual(result, []);
});

test('Exclude versions merged between release branches if they have the same "channel"', t => {
  const result = getReleasesToAdd({
    branch: {
      name: 'master',
      channel: 'latest',
      tags: [
        {gitTag: 'v1.0.0', channel: 'latest', version: '1.0.0', gitHead: '111'},
        {gitTag: 'v1.1.0', channel: 'latest', version: '1.1.0', gitHead: '222'},
        {gitTag: 'v2.0.0', channel: 'latest', version: '2.0.0', gitHead: '333'},
      ],
    },
    branches: [
      {name: 'master', channel: 'latest'},
      {name: 'next', channel: 'latest'},
      {name: 'next-major', channel: 'latest'},
    ],
    options: {tagFormat: `v\${version}`},
  });

  t.deepEqual(result, []);
});

test('Exclude versions merged between release branches if they all have "channel" set to "false"', t => {
  const result = getReleasesToAdd({
    branch: {
      name: 'master',
      channel: false,
      tags: [
        {gitTag: 'v1.0.0', version: '1.0.0', gitHead: '111'},
        {gitTag: 'v1.1.0', version: '1.1.0', gitHead: '222'},
        {gitTag: 'v2.0.0', version: '2.0.0', gitHead: '333'},
      ],
    },
    branches: [{name: 'master', channel: false}, {name: 'next', channel: false}, {name: 'next-major', channel: false}],
    options: {tagFormat: `v\${version}`},
  });

  t.deepEqual(result, []);
});

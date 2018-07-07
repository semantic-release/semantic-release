import test from 'ava';
import normalize from '../../lib/branches/normalize';

const toTags = versions => versions.map(version => ({version}));

test('Maintenance branches - initial state', t => {
  const maintenance = [{name: '1.x', tags: []}, {name: '1.1.x', tags: []}, {name: '1.2.x', tags: []}];
  const release = [{name: 'master', tags: []}];
  t.deepEqual(
    normalize
      .maintenance({maintenance, release})
      .map(({type, name, range, accept, channel, 'merge-range': maintenanceRange}) => ({
        type,
        name,
        range,
        accept,
        channel,
        'merge-range': maintenanceRange,
      })),
    [
      {
        type: 'maintenance',
        name: '1.1.x',
        range: '>=1.1.0 <1.0.0',
        accept: [],
        channel: '1.1.x',
        'merge-range': '>=1.1.0 <1.2.0',
      },
      {
        type: 'maintenance',
        name: '1.2.x',
        range: '>=1.2.0 <1.0.0',
        accept: [],
        channel: '1.2.x',
        'merge-range': '>=1.2.0 <1.3.0',
      },
      {
        type: 'maintenance',
        name: '1.x',
        range: '>=1.3.0 <1.0.0',
        accept: [],
        channel: '1.x',
        'merge-range': '>=1.3.0 <2.0.0',
      },
    ]
  );
});

test('Maintenance branches - cap range to first release present on default branch and not in any Maintenance one', t => {
  const maintenance = [
    {name: '1.x', tags: toTags(['1.0.0', '1.1.0', '1.1.1', '1.2.0', '1.2.1', '1.3.0', '1.4.0', '1.5.0'])},
    {name: 'name', range: '1.1.x', tags: toTags(['1.0.0', '1.0.1', '1.1.0', '1.1.1'])},
    {name: '1.2.x', tags: toTags(['1.0.0', '1.1.0', '1.1.1', '1.2.0', '1.2.1'])},
    {name: '2.x.x', tags: toTags(['1.0.0', '1.1.0', '1.1.1', '1.2.0', '1.2.1', '1.5.0'])},
  ];
  const release = [
    {
      name: 'master',
      tags: toTags(['1.0.0', '1.1.0', '1.1.1', '1.2.0', '1.2.1', '1.3.0', '1.4.0', '1.5.0', '1.6.0', '2.0.0']),
    },
  ];

  t.deepEqual(
    normalize
      .maintenance({maintenance, release})
      .map(({type, name, range, accept, channel, 'merge-range': maintenanceRange}) => ({
        type,
        name,
        range,
        accept,
        channel,
        'merge-range': maintenanceRange,
      })),
    [
      {
        type: 'maintenance',
        name: 'name',
        range: '>=1.1.1 <1.2.0',
        accept: ['patch'],
        channel: 'name',
        'merge-range': '>=1.1.0 <1.2.0',
      },
      {
        type: 'maintenance',
        name: '1.2.x',
        range: '>=1.2.1 <1.3.0',
        accept: ['patch'],
        channel: '1.2.x',
        'merge-range': '>=1.2.0 <1.3.0',
      },
      {
        type: 'maintenance',
        name: '1.x',
        range: '>=1.5.0 <1.6.0',
        accept: ['patch'],
        channel: '1.x',
        'merge-range': '>=1.3.0 <2.0.0',
      },
      {
        type: 'maintenance',
        name: '2.x.x',
        range: '>=2.0.0 <1.6.0',
        accept: [],
        channel: '2.x.x',
        'merge-range': '>=2.0.0 <3.0.0',
      },
    ]
  );
});

test('Maintenance branches - cap range to default branch last release if all release are also present on maintenance branch', t => {
  const maintenance = [
    {name: '1.x', tags: toTags(['1.0.0', '1.2.0', '1.3.0'])},
    {name: '2.x.x', tags: toTags(['1.0.0', '1.2.0', '1.3.0', '2.0.0'])},
  ];
  const release = [{name: 'master', tags: toTags(['1.0.0', '1.2.0', '1.3.0', '2.0.0'])}];

  t.deepEqual(
    normalize
      .maintenance({maintenance, release})
      .map(({type, name, range, accept, channel, 'merge-range': maintenanceRange}) => ({
        type,
        name,
        range,
        accept,
        channel,
        'merge-range': maintenanceRange,
      })),
    [
      {
        type: 'maintenance',
        name: '1.x',
        range: '>=1.3.0 <2.0.0',
        accept: ['patch', 'minor'],
        channel: '1.x',
        'merge-range': '>=1.0.0 <2.0.0',
      },
      {
        type: 'maintenance',
        name: '2.x.x',
        range: '>=2.0.0 <2.0.0',
        accept: [],
        channel: '2.x.x',
        'merge-range': '>=2.0.0 <3.0.0',
      },
    ]
  );
});

test('Release branches - initial state', t => {
  const release = [{name: 'master', tags: []}, {name: 'next', tags: []}, {name: 'next-major', tags: []}];

  t.deepEqual(
    normalize.release({release}).map(({type, name, range, accept, channel}) => ({type, name, range, accept, channel})),
    [
      {type: 'release', name: 'master', range: '>=1.0.0 <1.1.0', accept: ['patch'], channel: undefined},
      {type: 'release', name: 'next', range: '>=1.1.0 <2.0.0', accept: ['patch', 'minor'], channel: 'next'},
      {
        type: 'release',
        name: 'next-major',
        range: '>=2.0.0',
        accept: ['patch', 'minor', 'major'],
        channel: 'next-major',
      },
    ]
  );
});

test('Release branches - 3 release branches', t => {
  const release = [
    {name: 'master', tags: toTags(['1.0.0', '1.0.1', '1.0.2'])},
    {name: 'next', tags: toTags(['1.0.0', '1.0.1', '1.0.2', '1.1.0', '1.2.0'])},
    {name: 'next-major', tags: toTags(['1.0.0', '1.0.1', '1.0.2', '1.1.0', '1.2.0', '2.0.0', '2.0.1', '2.1.0'])},
  ];

  t.deepEqual(
    normalize.release({release}).map(({type, name, range, accept, channel}) => ({type, name, range, accept, channel})),
    [
      {type: 'release', name: 'master', range: '>=1.0.2 <1.1.0', accept: ['patch'], channel: undefined},
      {type: 'release', name: 'next', range: '>=1.2.0 <2.0.0', accept: ['patch', 'minor'], channel: 'next'},
      {
        type: 'release',
        name: 'next-major',
        range: '>=2.1.0',
        accept: ['patch', 'minor', 'major'],
        channel: 'next-major',
      },
    ]
  );
});

test('Release branches - 2 release branches', t => {
  const release = [
    {name: 'master', tags: toTags(['1.0.0', '1.0.1', '1.1.0', '1.1.1', '1.2.0'])},
    {name: 'next', tags: toTags(['1.0.0', '1.0.1', '1.1.0', '1.1.1', '1.2.0', '2.0.0', '2.0.1', '2.1.0'])},
  ];

  t.deepEqual(
    normalize.release({release}).map(({type, name, range, accept, channel}) => ({type, name, range, accept, channel})),
    [
      {type: 'release', name: 'master', range: '>=1.2.0 <2.0.0', accept: ['patch', 'minor'], channel: undefined},
      {type: 'release', name: 'next', range: '>=2.1.0', accept: ['patch', 'minor', 'major'], channel: 'next'},
    ]
  );
});

test('Release branches - 1 release branches', t => {
  const release = [{name: 'master', tags: toTags(['1.0.0', '1.1.0', '1.1.1', '1.2.0'])}];

  t.deepEqual(
    normalize.release({release}).map(({type, name, range, accept, channel}) => ({type, name, range, accept, channel})),
    [{type: 'release', name: 'master', range: '>=1.2.0', accept: ['patch', 'minor', 'major'], channel: undefined}]
  );
});

test('Release branches - cap ranges to first release only present on following branch', t => {
  const release = [
    {name: 'master', tags: toTags(['1.0.0', '1.1.0', '1.2.0', '2.0.0'])},
    {name: 'next', tags: toTags(['1.0.0', '1.1.0', '1.2.0', '2.0.0', '2.1.0'])},
    {name: 'next-major', tags: toTags(['1.0.0', '1.1.0', '1.2.0', '2.0.0', '2.1.0', '2.2.0'])},
  ];

  t.deepEqual(
    normalize.release({release}).map(({type, name, range, accept, channel}) => ({type, name, range, accept, channel})),
    [
      {type: 'release', name: 'master', range: '>=2.0.0 <2.1.0', accept: ['patch'], channel: undefined},
      {type: 'release', name: 'next', range: '>=2.1.0 <2.2.0', accept: ['patch'], channel: 'next'},
      {
        type: 'release',
        name: 'next-major',
        range: '>=2.2.0',
        accept: ['patch', 'minor', 'major'],
        channel: 'next-major',
      },
    ]
  );
});

test('Release branches - Handle missing previous tags in branch history', t => {
  const release = [
    {name: 'master', tags: toTags(['1.0.0', '2.0.0'])},
    {name: 'next', tags: toTags(['1.0.0', '1.1.0', '1.1.1', '1.2.0', '2.0.0'])},
  ];

  t.deepEqual(
    normalize.release({release}).map(({type, name, range, accept, channel}) => ({type, name, range, accept, channel})),
    [
      {type: 'release', name: 'master', range: '>=2.0.0 <3.0.0', accept: ['patch', 'minor'], channel: undefined},
      {type: 'release', name: 'next', range: '>=3.0.0', accept: ['patch', 'minor', 'major'], channel: 'next'},
    ]
  );
});

test('Release branches - enforce release gaps after downstream merge', t => {
  const release = [
    {name: 'master', tags: toTags(['1.0.0', '1.1.0', '2.0.0'])},
    {name: 'next', tags: toTags(['1.0.0', '1.1.0', '2.0.0'])},
    {name: 'next-major', tags: toTags(['1.0.0', '1.1.0', '2.0.0'])},
  ];

  t.deepEqual(
    normalize.release({release}).map(({type, name, range, accept, channel}) => ({type, name, range, accept, channel})),
    [
      {type: 'release', name: 'master', range: '>=2.0.0 <2.1.0', accept: ['patch'], channel: undefined},
      {type: 'release', name: 'next', range: '>=2.1.0 <3.0.0', accept: ['patch', 'minor'], channel: 'next'},
      {
        type: 'release',
        name: 'next-major',
        range: '>=3.0.0',
        accept: ['patch', 'minor', 'major'],
        channel: 'next-major',
      },
    ]
  );
});

test('Release branches - limit releases on 2nd and 3rd branche based on 1st branch last release', t => {
  const release = [
    {name: 'master', tags: toTags(['1.0.0', '1.1.0', '2.0.0', '3.0.0'])},
    {name: 'next', tags: toTags(['1.0.0', '1.1.0'])},
    {name: 'next-major', tags: toTags(['1.0.0', '1.1.0', '2.0.0'])},
  ];

  t.deepEqual(
    normalize.release({release}).map(({type, name, range, accept, channel}) => ({type, name, range, accept, channel})),
    [
      {type: 'release', name: 'master', range: '>=3.0.0 <3.1.0', accept: ['patch'], channel: undefined},
      {type: 'release', name: 'next', range: '>=3.1.0 <4.0.0', accept: ['patch', 'minor'], channel: 'next'},
      {
        type: 'release',
        name: 'next-major',
        range: '>=4.0.0',
        accept: ['patch', 'minor', 'major'],
        channel: 'next-major',
      },
    ]
  );
});

test('Prerelease branches', t => {
  const prerelease = [{name: 'beta', prerelease: true, tags: []}, {name: 'alpha', prerelease: 'preview', tags: []}];

  t.deepEqual(normalize.prerelease({prerelease}).map(({type, name, channel}) => ({type, name, channel})), [
    {type: 'prerelease', name: 'beta', channel: 'beta'},
    {type: 'prerelease', name: 'alpha', channel: 'alpha'},
  ]);
});

import test from 'ava';
import getTags from '../../lib/branches/get-tags';
import {gitRepo, gitCommits, gitTagVersion, gitCheckout, merge, changeAuthor} from '../helpers/git-utils';

test('Get the valid tags', async t => {
  const {cwd} = await gitRepo();
  const commits = await gitCommits(['First'], {cwd});
  await gitTagVersion('foo', undefined, {cwd});
  await gitTagVersion('v2.0.0', undefined, {cwd});
  commits.push(...(await gitCommits(['Second'], {cwd})));
  await gitTagVersion('v1.0.0', undefined, {cwd});
  commits.push(...(await gitCommits(['Third'], {cwd})));
  await gitTagVersion('v3.0', undefined, {cwd});
  commits.push(...(await gitCommits(['Fourth'], {cwd})));
  await gitTagVersion('v3.0.0-beta.1', undefined, {cwd});

  const result = await getTags({cwd, options: {tagFormat: `v\${version}`}}, [{name: 'master'}]);

  t.deepEqual(result, [
    {
      name: 'master',
      tags: [
        {gitTag: 'v1.0.0', version: '1.0.0', channel: undefined, gitHead: commits[1].hash},
        {gitTag: 'v2.0.0', version: '2.0.0', channel: undefined, gitHead: commits[0].hash},
        {gitTag: 'v3.0.0-beta.1', version: '3.0.0-beta.1', channel: undefined, gitHead: commits[3].hash},
      ],
    },
  ]);
});

test('Get the valid tags from multiple branches', async t => {
  const {cwd} = await gitRepo();
  const commits = await gitCommits(['First'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitTagVersion('v1.0.0@1.x', undefined, {cwd});
  commits.push(...(await gitCommits(['Second'], {cwd})));
  await gitTagVersion('v1.1.0', undefined, {cwd});
  await gitTagVersion('v1.1.0@1.x', undefined, {cwd});
  await gitCheckout('1.x', true, {cwd});
  await gitCheckout('master', false, {cwd});
  commits.push(...(await gitCommits(['Third'], {cwd})));
  await gitTagVersion('v2.0.0', undefined, {cwd});
  await gitTagVersion('v2.0.0@next', undefined, {cwd});
  await gitCheckout('next', true, {cwd});
  commits.push(...(await gitCommits(['Fourth'], {cwd})));
  await gitTagVersion('v3.0.0@next', undefined, {cwd});

  const result = await getTags({cwd, options: {tagFormat: `v\${version}`}}, [
    {name: '1.x'},
    {name: 'master'},
    {name: 'next'},
  ]);

  t.deepEqual(result, [
    {
      name: '1.x',
      tags: [
        {gitTag: 'v1.0.0', version: '1.0.0', channel: undefined, gitHead: commits[0].hash},
        {gitTag: 'v1.0.0@1.x', version: '1.0.0', channel: '1.x', gitHead: commits[0].hash},
        {gitTag: 'v1.1.0', version: '1.1.0', channel: undefined, gitHead: commits[1].hash},
        {gitTag: 'v1.1.0@1.x', version: '1.1.0', channel: '1.x', gitHead: commits[1].hash},
      ],
    },
    {
      name: 'master',
      tags: [
        ...result[0].tags,
        {gitTag: 'v2.0.0', version: '2.0.0', channel: undefined, gitHead: commits[2].hash},
        {gitTag: 'v2.0.0@next', version: '2.0.0', channel: 'next', gitHead: commits[2].hash},
      ],
    },
    {
      name: 'next',
      tags: [...result[1].tags, {gitTag: 'v3.0.0@next', version: '3.0.0', channel: 'next', gitHead: commits[3].hash}],
    },
  ]);
});

test('Match the tag name from the begining of the string and the channel from the last "@"', async t => {
  const {cwd} = await gitRepo();
  const commits = await gitCommits(['First'], {cwd});
  await gitTagVersion('prefix@v1.0.0', undefined, {cwd});
  await gitTagVersion('prefix@v1.0.0@next', undefined, {cwd});
  await gitTagVersion('prefix@v2.0.0', undefined, {cwd});
  await gitTagVersion('prefix@v2.0.0@next', undefined, {cwd});
  await gitTagVersion('other-prefix@v3.0.0', undefined, {cwd});

  const result = await getTags({cwd, options: {tagFormat: `prefix@v\${version}`}}, [{name: 'master'}]);

  t.deepEqual(result, [
    {
      name: 'master',
      tags: [
        {gitTag: 'prefix@v1.0.0', version: '1.0.0', channel: undefined, gitHead: commits[0].hash},
        {gitTag: 'prefix@v1.0.0@next', version: '1.0.0', channel: 'next', gitHead: commits[0].hash},
        {gitTag: 'prefix@v2.0.0', version: '2.0.0', channel: undefined, gitHead: commits[0].hash},
        {gitTag: 'prefix@v2.0.0@next', version: '2.0.0', channel: 'next', gitHead: commits[0].hash},
      ],
    },
  ]);
});

test('Return branches with and empty tags array if no valid tag is found', async t => {
  const {cwd} = await gitRepo();
  await gitCommits(['First'], {cwd});
  await gitTagVersion('foo', undefined, {cwd});
  await gitCommits(['Second'], {cwd});
  await gitTagVersion('v2.0.x', undefined, {cwd});
  await gitCommits(['Third'], {cwd});
  await gitTagVersion('v3.0', undefined, {cwd});

  const result = await getTags({cwd, options: {tagFormat: `prefix@v\${version}`}}, [{name: 'master'}, {name: 'next'}]);

  t.deepEqual(result, [{name: 'master', tags: []}, {name: 'next', tags: []}]);
});

test('Return branches with and empty tags array if no valid tag is found in history of configured branches', async t => {
  const {cwd} = await gitRepo();
  await gitCommits(['First'], {cwd});
  await gitCheckout('other-branch', true, {cwd});
  await gitCommits(['Second'], {cwd});
  await gitTagVersion('v1.0.0', undefined, {cwd});
  await gitTagVersion('v1.0.0@next', undefined, {cwd});
  await gitTagVersion('v2.0.0', undefined, {cwd});
  await gitTagVersion('v2.0.0@next', undefined, {cwd});
  await gitTagVersion('v3.0.0', undefined, {cwd});
  await gitTagVersion('v3.0.0@next', undefined, {cwd});
  await gitCheckout('master', false, {cwd});

  const result = await getTags({cwd, options: {tagFormat: `prefix@v\${version}`}}, [{name: 'master'}, {name: 'next'}]);

  t.deepEqual(result, [{name: 'master', tags: []}, {name: 'next', tags: []}]);
});

test('Get the highest valid tag corresponding to the "tagFormat"', async t => {
  const {cwd} = await gitRepo();
  const commits = await gitCommits(['First'], {cwd});

  await gitTagVersion('1.0.0', undefined, {cwd});
  t.deepEqual(await getTags({cwd, options: {tagFormat: `\${version}`}}, [{name: 'master'}]), [
    {name: 'master', tags: [{gitTag: '1.0.0', version: '1.0.0', channel: undefined, gitHead: commits[0].hash}]},
  ]);

  await gitTagVersion('foo-1.0.0-bar', undefined, {cwd});
  t.deepEqual(await getTags({cwd, options: {tagFormat: `foo-\${version}-bar`}}, [{name: 'master'}]), [
    {name: 'master', tags: [{gitTag: 'foo-1.0.0-bar', version: '1.0.0', channel: undefined, gitHead: commits[0].hash}]},
  ]);

  await gitTagVersion('foo-v1.0.0-bar', undefined, {cwd});
  t.deepEqual(await getTags({cwd, options: {tagFormat: `foo-v\${version}-bar`}}, [{name: 'master'}]), [
    {
      name: 'master',
      tags: [{gitTag: 'foo-v1.0.0-bar', version: '1.0.0', channel: undefined, gitHead: commits[0].hash}],
    },
  ]);

  await gitTagVersion('(.+)/1.0.0/(a-z)', undefined, {cwd});
  t.deepEqual(await getTags({cwd, options: {tagFormat: `(.+)/\${version}/(a-z)`}}, [{name: 'master'}]), [
    {
      name: 'master',
      tags: [{gitTag: '(.+)/1.0.0/(a-z)', version: '1.0.0', channel: undefined, gitHead: commits[0].hash}],
    },
  ]);

  await gitTagVersion('2.0.0-1.0.0-bar.1', undefined, {cwd});
  t.deepEqual(await getTags({cwd, options: {tagFormat: `2.0.0-\${version}-bar.1`}}, [{name: 'master'}]), [
    {
      name: 'master',
      tags: [{gitTag: '2.0.0-1.0.0-bar.1', version: '1.0.0', channel: undefined, gitHead: commits[0].hash}],
    },
  ]);

  await gitTagVersion('3.0.0-bar.2', undefined, {cwd});
  t.deepEqual(await getTags({cwd, options: {tagFormat: `\${version}-bar.2`}}, [{name: 'master'}]), [
    {name: 'master', tags: [{gitTag: '3.0.0-bar.2', version: '3.0.0', channel: undefined, gitHead: commits[0].hash}]},
  ]);
});

test('Get the tag on branch where commits have been rebased', async t => {
  const {cwd} = await gitRepo();
  const commits = await gitCommits(['First'], {cwd});
  await gitCheckout('next', true, {cwd});
  commits.push(...(await gitCommits(['Second/n/n/commit body'], {cwd})));
  await gitTagVersion('v1.0.0@next', undefined, {cwd});
  await gitCheckout('master', false, {cwd});
  await merge('next', {cwd});
  // Simulate GitHub "Rebase and Merge" by changing the committer info, which will result in a new commit sha and losing the tag
  await changeAuthor(commits[1].hash, {cwd});

  const result = await getTags({cwd, options: {tagFormat: `v\${version}`}}, [{name: 'master'}, {name: 'next'}]);

  t.deepEqual(result, [
    {
      name: 'master',
      tags: [{gitTag: 'v1.0.0@next', version: '1.0.0', channel: 'next', gitHead: commits[1].hash}],
    },
    {
      name: 'next',
      tags: [{gitTag: 'v1.0.0@next', version: '1.0.0', channel: 'next', gitHead: commits[1].hash}],
    },
  ]);
});

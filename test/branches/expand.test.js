import test from 'ava';
import expand from '../../lib/branches/expand';
import {gitRepo, gitCommits, gitCheckout, gitPush} from '../helpers/git-utils';

test('Expand branches defined with globs', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  await gitCommits(['First'], {cwd});
  await gitPush(repositoryUrl, 'master', {cwd});
  await gitCheckout('1.0.x', true, {cwd});
  await gitCommits(['Second'], {cwd});
  await gitPush(repositoryUrl, '1.0.x', {cwd});
  await gitCheckout('1.x.x', true, {cwd});
  await gitCommits(['Third'], {cwd});
  await gitPush(repositoryUrl, '1.x.x', {cwd});
  await gitCheckout('2.x', true, {cwd});
  await gitCommits(['Fourth'], {cwd});
  await gitPush(repositoryUrl, '2.x', {cwd});
  await gitCheckout('next', true, {cwd});
  await gitCommits(['Fifth'], {cwd});
  await gitPush(repositoryUrl, 'next', {cwd});
  await gitCheckout('pre/foo', true, {cwd});
  await gitCommits(['Sixth'], {cwd});
  await gitPush(repositoryUrl, 'pre/foo', {cwd});
  await gitCheckout('pre/bar', true, {cwd});
  await gitCommits(['Seventh'], {cwd});
  await gitPush(repositoryUrl, 'pre/bar', {cwd});
  await gitCheckout('beta', true, {cwd});
  await gitCommits(['Eighth'], {cwd});
  await gitPush(repositoryUrl, 'beta', {cwd});

  const branches = [
    // Should match all maintenance type branches
    {name: '+([0-9])?(.{+([0-9]),x}).x'},
    {name: 'master', channel: 'latest'},
    {name: 'next'},
    {name: 'pre/{foo,bar}', channel: `\${name.replace(/^pre\\//g, '')}`, prerelease: true},
    // Should be ignored as there is no matching branches in the repo
    {name: 'missing'},
    // Should be ignored as the matching branch in the repo is already matched by `/^pre\\/(\\w+)$/gi`
    {name: '*/foo', channel: 'foo', prerelease: 'foo'},
    {name: 'beta', channel: `channel-\${name}`, prerelease: true},
  ];

  t.deepEqual(await expand({cwd}, branches), [
    {name: '1.0.x'},
    {name: '1.x.x'},
    {name: '2.x'},
    {name: 'master', channel: 'latest'},
    {name: 'next'},
    {name: 'pre/bar', channel: 'bar', prerelease: true},
    {name: 'pre/foo', channel: 'foo', prerelease: true},
    {name: 'beta', channel: 'channel-beta', prerelease: true},
  ]);
});

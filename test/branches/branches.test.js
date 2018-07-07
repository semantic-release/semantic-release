import test from 'ava';
import {union} from 'lodash';
import semver from 'semver';
import proxyquire from 'proxyquire';

const getBranch = (branches, branch) => branches.find(({name}) => name === branch);
const release = (branches, name, version) => getBranch(branches, name).tags.push({version});
const merge = (branches, source, target, tag) => {
  getBranch(branches, target).tags = union(
    getBranch(branches, source).tags.filter(({version}) => !tag || semver.cmp(version, '<=', tag)),
    getBranch(branches, target).tags
  );
};

test('Enforce ranges with branching release workflow', async t => {
  const branches = [
    {name: '1.x', tags: []},
    {name: '1.0.x', tags: []},
    {name: 'master', tags: []},
    {name: 'next', tags: []},
    {name: 'next-major', tags: []},
    {name: 'beta', prerelease: true, tags: []},
    {name: 'alpha', prerelease: true, tags: []},
  ];
  const getBranches = proxyquire('../../lib/branches', {'./get-tags': () => branches});

  let result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, '1.0.x').range, '>=1.0.0 <1.0.0', 'Cannot release on 1.0.x before a releasing on master');
  t.is(getBranch(result, '1.x').range, '>=1.1.0 <1.0.0', 'Cannot release on 1.x before a releasing on master');
  t.is(getBranch(result, 'master').range, '>=1.0.0 <1.1.0', 'Can release only patch on master');
  t.is(getBranch(result, 'next').range, '>=1.1.0 <2.0.0', 'Can release only minor on next');
  t.is(getBranch(result, 'next-major').range, '>=2.0.0', 'Can release only major on next-major');

  release(branches, 'master', '1.0.0');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, '1.0.x').range, '>=1.0.0 <1.0.0', 'Cannot release on 1.0.x before a releasing on master');
  t.is(getBranch(result, '1.x').range, '>=1.1.0 <1.0.0', 'Cannot release on 1.x before a releasing on master');
  t.is(getBranch(result, 'master').range, '>=1.0.0 <1.1.0', 'Can release only patch on master');

  release(branches, 'master', '1.0.1');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, 'master').range, '>=1.0.1 <1.1.0', 'Can release only patch, > than 1.0.1 on master');

  merge(branches, 'master', 'next');
  merge(branches, 'master', 'next-major');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, 'master').range, '>=1.0.1 <1.1.0', 'Can release only patch, > than 1.0.1 on master');
  t.is(getBranch(result, 'next').range, '>=1.1.0 <2.0.0', 'Can release only minor on next');
  t.is(getBranch(result, 'next-major').range, '>=2.0.0', 'Can release only major on next-major');

  release(branches, 'next', '1.1.0');
  release(branches, 'next', '1.1.1');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, 'next').range, '>=1.1.1 <2.0.0', 'Can release only patch or minor, > than 1.1.0 on next');

  release(branches, 'next-major', '2.0.0');
  release(branches, 'next-major', '2.0.1');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, 'next-major').range, '>=2.0.1', 'Can release any version, > than 2.0.1 on next-major');

  merge(branches, 'next-major', 'beta');
  release(branches, 'beta', '3.0.0-beta.1');
  merge(branches, 'beta', 'alpha');
  release(branches, 'alpha', '4.0.0-alpha.1');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, 'next-major').range, '>=2.0.1', 'Can release any version, > than 2.0.1 on next-major');

  merge(branches, 'master', '1.0.x');
  merge(branches, 'master', '1.x');
  release(branches, 'master', '1.0.1');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, 'master').range, '>=1.0.1 <1.1.0', 'Can release only patch, > than 1.0.1 on master');
  t.is(
    getBranch(result, '1.0.x').range,
    '>=1.0.1 <1.0.1',
    'Cannot release on 1.0.x before >= 1.1.0 is released on master'
  );
  t.is(getBranch(result, '1.x').range, '>=1.1.0 <1.0.1', 'Cannot release on 1.x before >= 1.2.0 is released on master');

  release(branches, 'master', '1.0.2');
  release(branches, 'master', '1.0.3');
  release(branches, 'master', '1.0.4');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, 'master').range, '>=1.0.4 <1.1.0', 'Can release only patch, > than 1.0.4 on master');
  t.is(
    getBranch(result, '1.0.x').range,
    '>=1.0.1 <1.0.2',
    'Cannot release on 1.0.x before >= 1.1.0 is released on master'
  );
  t.is(getBranch(result, '1.x').range, '>=1.1.0 <1.0.2', 'Cannot release on 1.x before >= 1.2.0 is released on master');

  merge(branches, 'next', 'master');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, 'master').range, '>=1.1.1 <1.2.0', 'Can release only patch, > than 1.1.1 on master');
  t.is(getBranch(result, 'next').range, '>=1.2.0 <2.0.0', 'Can release only patch or minor, > than 1.2.0 on next');
  t.is(getBranch(result, 'next-major').range, '>=2.0.1', 'Can release any version, > than 2.0.1 on next-major');
  t.is(
    getBranch(result, '1.0.x').range,
    '>=1.0.1 <1.0.2',
    'Cannot release on 1.0.x before 1.0.x version from master are merged'
  );
  t.is(getBranch(result, '1.x').range, '>=1.1.0 <1.0.2', 'Cannot release on 1.x before >= 2.0.0 is released on master');

  merge(branches, 'master', '1.0.x', '1.0.4');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, 'master').range, '>=1.1.1 <1.2.0', 'Can release only patch, > than 1.1.1 on master');
  t.is(getBranch(result, '1.0.x').range, '>=1.0.4 <1.1.0', 'Can release on 1.0.x only within range');
  t.is(getBranch(result, '1.x').range, '>=1.1.0 <1.1.0', 'Cannot release on 1.x before >= 2.0.0 is released on master');

  merge(branches, 'master', '1.x');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, 'master').range, '>=1.1.1 <1.2.0', 'Can release only patch, > than 1.1.1 on master');
  t.is(getBranch(result, '1.0.x').range, '>=1.0.4 <1.1.0', 'Can release on 1.0.x only within range');
  t.is(getBranch(result, '1.x').range, '>=1.1.1 <1.1.1', 'Cannot release on 1.x before >= 2.0.0 is released on master');

  merge(branches, 'next-major', 'next');
  merge(branches, 'next', 'master');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, 'master').range, '>=2.0.1 <2.1.0', 'Can release only patch, > than 2.0.1 on master');
  t.is(getBranch(result, 'next').range, '>=2.1.0 <3.0.0', 'Can release only minor on next');
  t.is(getBranch(result, 'next-major').range, '>=3.0.0', 'Can release only major on next-major');
  t.is(getBranch(result, '1.x').range, '>=1.1.1 <2.0.0', 'Can release on 1.x only within range');

  merge(branches, 'beta', 'master');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, 'master').range, '>=2.0.1 <2.1.0', 'Can release only patch, > than 2.0.1 on master');
  t.is(getBranch(result, 'next').range, '>=2.1.0 <3.0.0', 'Can release only minor on next');
  t.is(getBranch(result, 'next-major').range, '>=3.0.0', 'Can release only major on next-major');

  branches.push({name: '1.1.x', tags: []});
  merge(branches, '1.x', '1.1.x');
  result = (await getBranches({options: {branches}})).map(({name, range}) => ({name, range}));
  t.is(getBranch(result, '1.0.x').range, '>=1.0.4 <1.1.0', 'Can release on 1.0.x only within range');
  t.is(getBranch(result, '1.1.x').range, '>=1.1.1 <1.2.0', 'Can release on 1.1.x only within range');
  t.is(getBranch(result, '1.x').range, '>=1.2.0 <2.0.0', 'Can release on 1.x only within range');
});

test('Throw SemanticReleaseError for invalid configurations', async t => {
  const branches = [
    {name: '123', range: '123', tags: []},
    {name: '1.x', tags: []},
    {name: 'maintenance-1', range: '1.x', tags: []},
    {name: '1.x.x', tags: []},
    {name: 'beta', prerelease: '', tags: []},
    {name: 'alpha', prerelease: 'alpha', tags: []},
    {name: 'preview', prerelease: 'alpha', tags: []},
  ];
  const getBranches = proxyquire('../../lib/branches', {'./get-tags': () => branches});
  const errors = [...(await t.throws(getBranches({options: {branches}})))];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'EMAINTENANCEBRANCH');
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
  t.is(errors[1].name, 'SemanticReleaseError');
  t.is(errors[1].code, 'EMAINTENANCEBRANCHES');
  t.truthy(errors[1].message);
  t.truthy(errors[1].details);
  t.is(errors[2].name, 'SemanticReleaseError');
  t.is(errors[2].code, 'EPRERELEASEBRANCH');
  t.truthy(errors[2].message);
  t.truthy(errors[2].details);
  t.is(errors[3].name, 'SemanticReleaseError');
  t.is(errors[3].code, 'EPRERELEASEBRANCHES');
  t.truthy(errors[3].message);
  t.truthy(errors[3].details);
  t.is(errors[4].name, 'SemanticReleaseError');
  t.is(errors[4].code, 'ERELEASEBRANCHES');
  t.truthy(errors[4].message);
  t.truthy(errors[4].details);
});

test('Throw a SemanticReleaseError if there is duplicate branches', async t => {
  const branches = [{name: 'master', tags: []}, {name: 'master', tags: []}];
  const getBranches = proxyquire('../../lib/branches', {'./get-tags': () => branches});

  const errors = [...(await t.throws(getBranches({options: {branches}})))];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'EDUPLICATEBRANCHES');
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
});

test('Throw a SemanticReleaseError for each invalid branch name', async t => {
  const branches = [{name: '~master', tags: []}, {name: '^master', tags: []}];
  const getBranches = proxyquire('../../lib/branches', {'./get-tags': () => branches});

  const errors = [...(await t.throws(getBranches({options: {branches}})))];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'EINVALIDBRANCHNAME');
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
  t.is(errors[1].name, 'SemanticReleaseError');
  t.is(errors[1].code, 'EINVALIDBRANCHNAME');
  t.truthy(errors[1].message);
  t.truthy(errors[1].details);
});

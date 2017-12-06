import test from 'ava';
import isPreRelease from '../src/lib/is-pre-release';

test('No pkg release option', t => {
  const pkg = {};
  const npm = {tag: 'latest'};

  const preRelease = isPreRelease({pkg, npm});

  t.false(preRelease);
});

test('No release.no-pre-release option', t => {
  const pkg = {release: {}};
  const npm = {tag: 'latest'};

  const preRelease = isPreRelease({pkg, npm});

  t.false(preRelease);
});

test('Invalid no-pre-release option', t => {
  const pkg = {release: {'no-pre-release': {}}};
  const npm = {tag: 'xpto2'};

  const preRelease = isPreRelease({pkg, npm});

  t.false(preRelease);
});

test('Empty no-pre-release option', t => {
  const pkg = {release: {'no-pre-release': []}};
  const npm = {tag: 'latest'};

  const preRelease = isPreRelease({pkg, npm});

  t.false(preRelease);
});

test('Dist tag is equal to no-pre-release string option', t => {
  const distTag = 'xpto';
  const pkg = {release: {'no-pre-release': distTag}};
  const npm = {tag: distTag};

  const preRelease = isPreRelease({pkg, npm});

  t.false(preRelease);
});

test('Dist Tag is included in no-pre-release single value array option', t => {
  const distTag = 'xpto';
  const pkg = {release: {'no-pre-release': [distTag]}};
  const npm = {tag: distTag};

  const preRelease = isPreRelease({pkg, npm});

  t.false(preRelease);
});

test('Dist tag is included in no-pre-release multiple value array option', t => {
  const distTag = 'xpto';
  const pkg = {release: {'no-pre-release': [distTag, 'yetAnotherValue']}};
  const npm = {tag: distTag};

  const preRelease = isPreRelease({pkg, npm});

  t.false(preRelease);
});

test('Distinct string no-pre-release option', t => {
  const pkg = {release: {'no-pre-release': 'xpto'}};
  const npm = {tag: 'xpto2'};

  const preRelease = isPreRelease({pkg, npm});

  t.true(preRelease);
});

test('Distinct array no-pre-release option', t => {
  const pkg = {release: {'no-pre-release': ['xpto']}};
  const npm = {tag: 'xpto2'};

  const preRelease = isPreRelease({pkg, npm});

  t.true(preRelease);
});

test('Distinct multiple value array no-pre-release option', t => {
  const pkg = {release: {'no-pre-release': ['xpto', 'yetAnotherValue']}};
  const npm = {tag: 'xpto2'};

  const preRelease = isPreRelease({pkg, npm});

  t.true(preRelease);
});

test('Dist tag is not latest', t => {
  const pkg = {release: {}};
  const npm = {tag: 'xpto2'};

  const preRelease = isPreRelease({pkg, npm});

  t.true(preRelease);
});

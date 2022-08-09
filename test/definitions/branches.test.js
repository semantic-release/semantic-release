const test = require('ava');
const {maintenance, prerelease, release} = require('../../lib/definitions/branches');

test('A "maintenance" branch is identified by having a "range" property or a "name" formatted like "N.x", "N.x.x" or "N.N.x"', (t) => {
  /* eslint-disable unicorn/no-fn-reference-in-iterator */
  t.true(maintenance.filter({name: '1.x.x'}));
  t.true(maintenance.filter({name: '1.0.x'}));
  t.true(maintenance.filter({name: '1.x'}));
  t.true(maintenance.filter({name: 'some-name', range: '1.x.x'}));
  t.true(maintenance.filter({name: 'some-name', range: '1.1.x'}));
  t.true(maintenance.filter({name: 'some-name', range: ''}));
  t.true(maintenance.filter({name: 'some-name', range: true}));

  t.false(maintenance.filter({name: 'some-name', range: null}));
  t.false(maintenance.filter({name: 'some-name', range: false}));
  t.false(maintenance.filter({name: 'some-name'}));
  t.false(maintenance.filter({name: '1.0.0'}));
  t.false(maintenance.filter({name: 'x.x.x'}));
  /* eslint-enable unicorn/no-fn-reference-in-iterator */
});

test('A "maintenance" branches must have a "range" property formatted like "N.x", "N.x.x" or "N.N.x"', (t) => {
  t.true(maintenance.branchValidator({name: 'some-name', range: '1.x.x'}));
  t.true(maintenance.branchValidator({name: 'some-name', range: '1.1.x'}));

  t.false(maintenance.branchValidator({name: 'some-name', range: '^1.0.0'}));
  t.false(maintenance.branchValidator({name: 'some-name', range: '>=1.0.0 <2.0.0'}));
  t.false(maintenance.branchValidator({name: 'some-name', range: '1.0.0'}));
  t.false(maintenance.branchValidator({name: 'some-name', range: 'wrong-range'}));
  t.false(maintenance.branchValidator({name: 'some-name', range: true}));
  t.false(maintenance.branchValidator({name: 'some-name', range: ''}));
});

test('The "maintenance" branches must have unique ranges', (t) => {
  t.true(maintenance.branchesValidator([{range: '1.x.x'}, {range: '1.0.x'}]));

  t.false(maintenance.branchesValidator([{range: '1.x.x'}, {range: '1.x.x'}]));
  t.false(maintenance.branchesValidator([{range: '1.x.x'}, {range: '1.x'}]));
});

test('A "prerelease" branch is identified by having a thruthy "prerelease" property', (t) => {
  /* eslint-disable unicorn/no-fn-reference-in-iterator */
  t.true(prerelease.filter({name: 'some-name', prerelease: true}));
  t.true(prerelease.filter({name: 'some-name', prerelease: 'beta'}));
  t.true(prerelease.filter({name: 'some-name', prerelease: ''}));

  t.false(prerelease.filter({name: 'some-name', prerelease: null}));
  t.false(prerelease.filter({name: 'some-name', prerelease: false}));
  t.false(prerelease.filter({name: 'some-name'}));
  /* eslint-enable unicorn/no-fn-reference-in-iterator */
});

test('A "prerelease" branch must have a valid prerelease detonation in "prerelease" property or in "name" if "prerelease" is "true"', (t) => {
  t.true(prerelease.branchValidator({name: 'beta', prerelease: true}));
  t.true(prerelease.branchValidator({name: 'some-name', prerelease: 'beta'}));

  t.false(prerelease.branchValidator({name: 'some-name', prerelease: ''}));
  t.false(prerelease.branchValidator({name: 'some-name', prerelease: null}));
  t.false(prerelease.branchValidator({name: 'some-name', prerelease: false}));
  t.false(prerelease.branchValidator({name: 'some-name', prerelease: '000'}));
  t.false(prerelease.branchValidator({name: 'some-name', prerelease: '#beta'}));
  t.false(prerelease.branchValidator({name: '000', prerelease: true}));
  t.false(prerelease.branchValidator({name: '#beta', prerelease: true}));
});

test('The "prerelease" branches must have unique "prerelease" property', (t) => {
  t.true(prerelease.branchesValidator([{prerelease: 'beta'}, {prerelease: 'alpha'}]));

  t.false(prerelease.branchesValidator([{range: 'beta'}, {range: 'beta'}, {range: 'alpha'}]));
});

test('A "release" branch is identified by not havin a "range" or "prerelease" property or a "name" formatted like "N.x", "N.x.x" or "N.N.x"', (t) => {
  /* eslint-disable unicorn/no-fn-reference-in-iterator */
  t.true(release.filter({name: 'some-name'}));

  t.false(release.filter({name: '1.x.x'}));
  t.false(release.filter({name: '1.0.x'}));
  t.false(release.filter({name: 'some-name', range: '1.x.x'}));
  t.false(release.filter({name: 'some-name', range: '1.1.x'}));
  t.false(release.filter({name: 'some-name', prerelease: true}));
  t.false(release.filter({name: 'some-name', prerelease: 'beta'}));
  /* eslint-enable unicorn/no-fn-reference-in-iterator */
});

test('There must be between 1 and 3 release branches', (t) => {
  t.true(release.branchesValidator([{name: 'branch1'}]));
  t.true(release.branchesValidator([{name: 'branch1'}, {name: 'branch2'}]));
  t.true(release.branchesValidator([{name: 'branch1'}, {name: 'branch2'}, {name: 'branch3'}]));

  t.false(release.branchesValidator([]));
  t.false(release.branchesValidator([{name: 'branch1'}, {name: 'branch2'}, {name: 'branch3'}, {name: 'branch4'}]));
});

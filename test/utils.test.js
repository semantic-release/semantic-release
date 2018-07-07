import test from 'ava';
import AggregateError from 'aggregate-error';
import {
  extractErrors,
  tagsToVersions,
  isMajorRange,
  isMaintenanceRange,
  getUpperBound,
  getLowerBound,
  highest,
  lowest,
  getLatestVersion,
  getEarliestVersion,
  getFirstVersion,
  getRange,
  makeTag,
} from '../lib/utils';

test('extractErrors', t => {
  const errors = [new Error('Error 1'), new Error('Error 2')];

  t.deepEqual(extractErrors(new AggregateError(errors)), errors);
  t.deepEqual(extractErrors(errors[0]), [errors[0]]);
});

test('tagsToVersions', t => {
  t.deepEqual(tagsToVersions([{version: '1.0.0'}, {version: '1.1.0'}, {version: '1.2.0'}]), [
    '1.0.0',
    '1.1.0',
    '1.2.0',
  ]);
});

test('isMajorRange', t => {
  t.false(isMajorRange('1.1.x'));
  t.false(isMajorRange('1.1.X'));
  t.false(isMajorRange('1.1.0'));

  t.true(isMajorRange('1.x.x'));
  t.true(isMajorRange('1.X.X'));
  t.true(isMajorRange('1.x'));
  t.true(isMajorRange('1.X'));
});

test('isMaintenanceRange', t => {
  t.true(isMaintenanceRange('1.1.x'));
  t.true(isMaintenanceRange('1.x.x'));
  t.true(isMaintenanceRange('1.x'));
  t.true(isMaintenanceRange('1.1.X'));
  t.true(isMaintenanceRange('1.X.X'));
  t.true(isMaintenanceRange('1.X'));

  t.false(isMaintenanceRange('1.1.0'));
  t.false(isMaintenanceRange('~1.0.0'));
  t.false(isMaintenanceRange('^1.0.0'));
});

test('getUpperBound', t => {
  t.is(getUpperBound('1.x.x'), '2.0.0');
  t.is(getUpperBound('1.x'), '2.0.0');
  t.is(getUpperBound('1.0.x'), '1.1.0');
  t.is(getUpperBound('1.0.0'), '1.0.0');

  t.is(getUpperBound('foo'), undefined);
});

test('getLowerBound', t => {
  t.is(getLowerBound('1.x.x'), '1.0.0');
  t.is(getLowerBound('1.x'), '1.0.0');
  t.is(getLowerBound('1.0.x'), '1.0.0');
  t.is(getLowerBound('1.0.0'), '1.0.0');

  t.is(getLowerBound('foo'), undefined);
});

test('highest', t => {
  t.is(highest('1.0.0', '2.0.0'), '2.0.0');
  t.is(highest('1.1.1', '1.1.0'), '1.1.1');
  t.is(highest(null, '1.0.0'), '1.0.0');
  t.is(highest('1.0.0'), '1.0.0');
  t.is(highest(), undefined);
});

test('lowest', t => {
  t.is(lowest('1.0.0', '2.0.0'), '1.0.0');
  t.is(lowest('1.1.1', '1.1.0'), '1.1.0');
  t.is(lowest(null, '1.0.0'), '1.0.0');
  t.is(lowest(), undefined);
});

test.serial('getLatestVersion', t => {
  t.is(getLatestVersion(['1.2.3-alpha.3', '1.2.0', '1.0.1', '1.0.0-alpha.1']), '1.2.0');
  t.is(getLatestVersion(['1.2.3-alpha.3', '1.2.3-alpha.2']), undefined);

  t.is(getLatestVersion(['1.2.3-alpha.3', '1.2.0', '1.0.1', '1.0.0-alpha.1']), '1.2.0');
  t.is(getLatestVersion(['1.2.3-alpha.3', '1.2.3-alpha.2']), undefined);

  t.is(getLatestVersion(['1.2.3-alpha.3', '1.2.0', '1.0.1', '1.0.0-alpha.1'], {withPrerelease: true}), '1.2.3-alpha.3');
  t.is(getLatestVersion(['1.2.3-alpha.3', '1.2.3-alpha.2'], {withPrerelease: true}), '1.2.3-alpha.3');

  t.is(getLatestVersion([]), undefined);
});

test.serial('getEarliestVersion', t => {
  t.is(getEarliestVersion(['1.2.3-alpha.3', '1.2.0', '1.0.0', '1.0.1-alpha.1']), '1.0.0');
  t.is(getEarliestVersion(['1.2.3-alpha.3', '1.2.3-alpha.2']), undefined);

  t.is(getEarliestVersion(['1.2.3-alpha.3', '1.2.0', '1.0.0', '1.0.1-alpha.1']), '1.0.0');
  t.is(getEarliestVersion(['1.2.3-alpha.3', '1.2.3-alpha.2']), undefined);

  t.is(
    getEarliestVersion(['1.2.3-alpha.3', '1.2.0', '1.0.1', '1.0.0-alpha.1'], {withPrerelease: true}),
    '1.0.0-alpha.1'
  );
  t.is(getEarliestVersion(['1.2.3-alpha.3', '1.2.3-alpha.2'], {withPrerelease: true}), '1.2.3-alpha.2');

  t.is(getEarliestVersion([]), undefined);
});

test('getFirstVersion', t => {
  t.is(getFirstVersion(['1.2.0', '1.0.0', '1.3.0', '1.1.0', '1.4.0'], []), '1.0.0');
  t.is(
    getFirstVersion(
      ['1.2.0', '1.0.0', '1.3.0', '1.1.0', '1.4.0'],
      [
        {name: 'master', tags: [{version: '1.0.0'}, {version: '1.1.0'}]},
        {name: 'next', tags: [{version: '1.0.0'}, {version: '1.1.0'}, {version: '1.2.0'}]},
      ]
    ),
    '1.3.0'
  );
  t.is(
    getFirstVersion(
      ['1.2.0', '1.0.0', '1.1.0'],
      [
        {name: 'master', tags: [{version: '1.0.0'}, {version: '1.1.0'}]},
        {name: 'next', tags: [{version: '1.0.0'}, {version: '1.1.0'}, {version: '1.2.0'}]},
      ]
    ),
    undefined
  );
});

test('getRange', t => {
  t.is(getRange('1.0.0', '1.1.0'), '>=1.0.0 <1.1.0');
  t.is(getRange('1.0.0'), '>=1.0.0');
});

test('makeTag', t => {
  t.is(makeTag(`v\${version}`, '1.0.0'), 'v1.0.0');
  t.is(makeTag(`v\${version}`, '1.0.0', 'next'), 'v1.0.0@next');
  t.is(makeTag(`v\${version}@test`, '1.0.0', 'next'), 'v1.0.0@next@test');
});

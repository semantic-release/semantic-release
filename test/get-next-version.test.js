import test from 'ava';
import {stub} from 'sinon';
import SemanticReleaseError from '@semantic-release/error';
import getNextVersion from '../lib/get-next-version';

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Increase version for patch release', t => {
  const version = getNextVersion('patch', {version: '1.0.0'}, t.context.logger);
  t.is(version, '1.0.1');
});

test('Increase version for minor release', t => {
  const version = getNextVersion('minor', {version: '1.0.0'}, t.context.logger);
  t.is(version, '1.1.0');
});

test('Increase version for major release', t => {
  const version = getNextVersion('major', {version: '1.0.0'}, t.context.logger);
  t.is(version, '2.0.0');
});

test('Return 1.0.0 if there is no previous release', t => {
  const version = getNextVersion('minor', {}, t.context.logger);
  t.is(version, '1.0.0');
});

test('Return an error if the release type is invalid', t => {
  const error = t.throws(() => getNextVersion('invalid', {version: '1.0.0'}, t.context.logger));
  t.is(error.code, 'EINVALIDTYPE');
  t.true(error instanceof SemanticReleaseError);
});

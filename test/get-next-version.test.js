import test from 'ava';
import {stub} from 'sinon';
import proxyquire from 'proxyquire';
import SemanticReleaseError from '@semantic-release/error';

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.getNextVersion = proxyquire('../lib/get-next-version', {'./logger': {log: t.context.log}});
});

test('Increase version for patch release', t => {
  const version = t.context.getNextVersion('patch', {version: '1.0.0'});
  t.is(version, '1.0.1');
});

test('Increase version for minor release', t => {
  const version = t.context.getNextVersion('minor', {version: '1.0.0'});
  t.is(version, '1.1.0');
});

test('Increase version for major release', t => {
  const version = t.context.getNextVersion('major', {version: '1.0.0'});
  t.is(version, '2.0.0');
});

test('Return 1.0.0 if there is no previous release', t => {
  const version = t.context.getNextVersion('minor', {});
  t.is(version, '1.0.0');
});

test('Return an error if the release type is invalid', t => {
  const error = t.throws(() => t.context.getNextVersion('invalid', {version: '1.0.0'}));
  t.is(error.code, 'EINVALIDTYPE');
  t.true(error instanceof SemanticReleaseError);
});

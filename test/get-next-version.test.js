import test from 'ava';
import {stub} from 'sinon';
import getNextVersion from '../lib/get-next-version';

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Increase version for patch release', t => {
  const version = getNextVersion({
    nextRelease: {type: 'patch'},
    lastRelease: {version: '1.0.0'},
    logger: t.context.logger,
  });
  t.is(version, '1.0.1');
});

test('Increase version for minor release', t => {
  const version = getNextVersion({
    nextRelease: {type: 'minor'},
    lastRelease: {version: '1.0.0'},
    logger: t.context.logger,
  });
  t.is(version, '1.1.0');
});

test('Increase version for major release', t => {
  const version = getNextVersion({
    nextRelease: {type: 'major'},
    lastRelease: {version: '1.0.0'},
    logger: t.context.logger,
  });
  t.is(version, '2.0.0');
});

test('Return 1.0.0 if there is no previous release', t => {
  const version = getNextVersion({nextRelease: {type: 'minor'}, lastRelease: {}, logger: t.context.logger});
  t.is(version, '1.0.0');
});

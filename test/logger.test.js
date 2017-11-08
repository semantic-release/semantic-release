import test from 'ava';
import {stub, match} from 'sinon';
import logger from '../lib/logger';

test.beforeEach(t => {
  t.context.log = stub(console, 'log');
  t.context.error = stub(console, 'error');
});

test.afterEach.always(t => {
  t.context.log.restore();
  t.context.error.restore();
});

test.serial('Basic log', t => {
  logger.log('test log');
  logger.error('test error');

  t.true(t.context.log.calledWithMatch(/.*test log/));
  t.true(t.context.error.calledWithMatch(/.*test error/));
});

test.serial('Log object', t => {
  const obj = {a: 1, b: '2'};
  logger.log(obj);
  logger.error(obj);

  t.true(t.context.log.calledWithMatch(match.string, obj));
  t.true(t.context.error.calledWithMatch(match.string, obj));
});

test.serial('Log with string formatting', t => {
  logger.log('test log %s', 'log value');
  logger.error('test error %s', 'error value');

  t.true(t.context.log.calledWithMatch(/.*test log/, 'log value'));
  t.true(t.context.error.calledWithMatch(/.*test error/, 'error value'));
});

test.serial('Log with error stacktrace and properties', t => {
  const error = new Error('error message');
  logger.error(error);
  const otherError = new Error('other error message');
  logger.error('test error %O', otherError);

  t.true(t.context.error.calledWithMatch(match.string, error));
  t.true(t.context.error.calledWithMatch(/.*test error/, otherError));
});

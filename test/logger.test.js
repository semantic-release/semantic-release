import test from 'ava';
import {stub} from 'sinon';
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

  t.regex(t.context.log.args[0][0], /.*test log/);
  t.regex(t.context.error.args[0][0], /.*test error/);
});

test.serial('Log object', t => {
  const obj = {a: 1, b: '2'};
  logger.log(obj);
  logger.error(obj);

  t.is(t.context.log.args[0][1], obj);
  t.is(t.context.error.args[0][1], obj);
});

test.serial('Log with string formatting', t => {
  logger.log('test log %s', 'log value');
  logger.error('test error %s', 'error value');

  t.regex(t.context.log.args[0][0], /.*test log/);
  t.regex(t.context.error.args[0][0], /.*test error/);
  t.is(t.context.log.args[0][1], 'log value');
  t.is(t.context.error.args[0][1], 'error value');
});

test.serial('Log with error stacktrace and properties', t => {
  const error = new Error('error message');
  logger.error(error);
  const otherError = new Error('other error message');
  logger.error('test error %O', otherError);

  t.is(t.context.error.args[0][1], error);
  t.regex(t.context.error.args[1][0], /.*test error/);
  t.is(t.context.error.args[1][1], otherError);
});

import test from 'ava';
import {stub} from 'sinon';
import logger from '../src/lib/logger';

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

test.serial('Log with string formatting', t => {
  logger.log('test log %s', 'log value');
  logger.error('test error %s', 'error value');

  t.true(t.context.log.calledWithMatch(/.*test log %s/, 'log value'));
  t.true(t.context.error.calledWithMatch(/.*test error %s/, 'error value'));
});

test.serial('Log with error stacktrace', t => {
  logger.error(new Error('error message'));
  logger.error('test error %s', new Error('other error message'));

  t.true(t.context.error.calledWithMatch(/.*test error %s/, /Error: other error message(\s|.)*?logger\.test\.js/));
  t.true(t.context.error.calledWithMatch(/Error: error message(\s|.)*?logger\.test\.js/));
});

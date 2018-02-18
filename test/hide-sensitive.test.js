import test from 'ava';
import clearModule from 'clear-module';

test.beforeEach(() => {
  process.env = {};
  clearModule('../lib/hide-sensitive');
});

test.serial('Replace multiple sensitive environment variable values', t => {
  process.env.SOME_PASSWORD = 'password';
  process.env.SOME_TOKEN = 'secret';
  t.is(
    require('../lib/hide-sensitive')(
      `https://user:${process.env.SOME_PASSWORD}@host.com?token=${process.env.SOME_TOKEN}`
    ),
    'https://user:[secure]@host.com?token=[secure]'
  );
});

test.serial('Replace multiple occurences of sensitive environment variable values', t => {
  process.env.secretKey = 'secret';
  t.is(
    require('../lib/hide-sensitive')(`https://user:${process.env.secretKey}@host.com?token=${process.env.secretKey}`),
    'https://user:[secure]@host.com?token=[secure]'
  );
});

test.serial('Escape regexp special characters', t => {
  process.env.SOME_CREDENTIALS = 'p$^{.+}\\w[a-z]o.*rd';
  t.is(
    require('../lib/hide-sensitive')(`https://user:${process.env.SOME_CREDENTIALS}@host.com`),
    'https://user:[secure]@host.com'
  );
});

test.serial('Accept "undefined" input', t => {
  t.is(require('../lib/hide-sensitive')(), undefined);
});

test.serial('Return same string if no environment variable has to be replaced', t => {
  t.is(require('../lib/hide-sensitive')('test'), 'test');
});

test.serial('Exclude empty environment variables from the regexp', t => {
  process.env.SOME_PASSWORD = 'password';
  process.env.SOME_TOKEN = '';
  t.is(
    require('../lib/hide-sensitive')(`https://user:${process.env.SOME_PASSWORD}@host.com?token=`),
    'https://user:[secure]@host.com?token='
  );
});

test.serial('Exclude empty environment variables from the regexp if there is only empty ones', t => {
  process.env.SOME_PASSWORD = '';
  process.env.SOME_TOKEN = ' \n ';
  t.is(require('../lib/hide-sensitive')(`https://host.com?token=`), 'https://host.com?token=');
});

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

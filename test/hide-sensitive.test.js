import test from 'ava';
import hideSensitive from '../lib/hide-sensitive';

test('Replace multiple sensitive environment variable values', t => {
  const env = {SOME_PASSWORD: 'password', SOME_TOKEN: 'secret'};
  t.is(
    hideSensitive(env)(`https://user:${env.SOME_PASSWORD}@host.com?token=${env.SOME_TOKEN}`),
    'https://user:[secure]@host.com?token=[secure]'
  );
});

test('Replace multiple occurences of sensitive environment variable values', t => {
  const env = {secretKey: 'secret'};
  t.is(
    hideSensitive(env)(`https://user:${env.secretKey}@host.com?token=${env.secretKey}`),
    'https://user:[secure]@host.com?token=[secure]'
  );
});

test('Escape regexp special characters', t => {
  const env = {SOME_CREDENTIALS: 'p$^{.+}\\w[a-z]o.*rd'};
  t.is(hideSensitive(env)(`https://user:${env.SOME_CREDENTIALS}@host.com`), 'https://user:[secure]@host.com');
});

test('Accept "undefined" input', t => {
  t.is(hideSensitive({})(), undefined);
});

test('Return same string if no environment variable has to be replaced', t => {
  t.is(hideSensitive({})('test'), 'test');
});

test('Exclude empty environment variables from the regexp', t => {
  const env = {SOME_PASSWORD: 'password', SOME_TOKEN: ''};
  t.is(
    hideSensitive(env)(`https://user:${env.SOME_PASSWORD}@host.com?token=`),
    'https://user:[secure]@host.com?token='
  );
});

test('Exclude empty environment variables from the regexp if there is only empty ones', t => {
  t.is(hideSensitive({SOME_PASSWORD: '', SOME_TOKEN: ' \n '})(`https://host.com?token=`), 'https://host.com?token=');
});

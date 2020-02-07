const test = require('ava');
const {repeat} = require('lodash');
const hideSensitive = require('../lib/hide-sensitive');
const {SECRET_REPLACEMENT, SECRET_MIN_SIZE} = require('../lib/definitions/constants');

test('Replace multiple sensitive environment variable values', t => {
  const env = {SOME_PASSWORD: 'password', SOME_TOKEN: 'secret'};
  t.is(
    hideSensitive(env)(`https://user:${env.SOME_PASSWORD}@host.com?token=${env.SOME_TOKEN}`),
    `https://user:${SECRET_REPLACEMENT}@host.com?token=${SECRET_REPLACEMENT}`
  );
});

test('Replace multiple occurences of sensitive environment variable values', t => {
  const env = {secretKey: 'secret'};
  t.is(
    hideSensitive(env)(`https://user:${env.secretKey}@host.com?token=${env.secretKey}`),
    `https://user:${SECRET_REPLACEMENT}@host.com?token=${SECRET_REPLACEMENT}`
  );
});

test('Escape regexp special characters', t => {
  const env = {SOME_CREDENTIALS: 'p$^{.+}\\w[a-z]o.*rd'};
  t.is(
    hideSensitive(env)(`https://user:${env.SOME_CREDENTIALS}@host.com`),
    `https://user:${SECRET_REPLACEMENT}@host.com`
  );
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
    `https://user:${SECRET_REPLACEMENT}@host.com?token=`
  );
});

test('Exclude empty environment variables from the regexp if there is only empty ones', t => {
  t.is(hideSensitive({SOME_PASSWORD: '', SOME_TOKEN: ' \n '})(`https://host.com?token=`), 'https://host.com?token=');
});

test('Exclude environment variables with value shorter than SECRET_MIN_SIZE from the regexp', t => {
  const SHORT_TOKEN = repeat('a', SECRET_MIN_SIZE - 1);
  const LONG_TOKEN = repeat('b', SECRET_MIN_SIZE);
  const env = {SHORT_TOKEN, LONG_TOKEN};
  t.is(
    hideSensitive(env)(`https://user:${SHORT_TOKEN}@host.com?token=${LONG_TOKEN}`),
    `https://user:${SHORT_TOKEN}@host.com?token=${SECRET_REPLACEMENT}`
  );
});

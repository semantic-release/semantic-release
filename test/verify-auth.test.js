import test from 'ava';
import SemanticReleaseError from '@semantic-release/error';
import verify from '../src/lib/verify-auth';

test('Verify npm and github auth', t => {
  // Call the verify module with options and env
  t.notThrows(() => verify({githubToken: 'sup'}, {NPM_TOKEN: 'yo'}));
});

test('Verify npm (old token and mail) and github auth', t => {
  // Call the verify module with options and env
  t.notThrows(() => verify({githubToken: 'sup'}, {NPM_OLD_TOKEN: 'yo', NPM_EMAIL: 'test@email.com'}));
});

test('Return error for missing github token', t => {
  // Call the verify module with options and env
  const error = t.throws(() => verify({}, {NPM_TOKEN: 'yo'}));
  // Verify error code and type
  t.is(error.code, 'ENOGHTOKEN');
  t.true(error instanceof SemanticReleaseError);
});

test('Return error for missing npm token', t => {
  // Call the verify module with options and env
  const error = t.throws(() => verify({githubToken: 'sup'}, {}));
  // Verify error code and type
  t.is(error.code, 'ENONPMTOKEN');
  t.true(error instanceof SemanticReleaseError);
});

test('Return error for missing old npm token', t => {
  // Call the verify module with options and env
  const error = t.throws(() => verify({githubToken: 'sup'}, {NPM_EMAIL: 'test@email.com'}));
  // Verify error code and type
  t.is(error.code, 'ENONPMTOKEN');
  t.true(error instanceof SemanticReleaseError);
});

test('Return error for missing npm email', t => {
  // Call the verify module with options and env
  const error = t.throws(() => verify({githubToken: 'sup'}, {NPM_OLD_TOKEN: 'yo'}));
  // Verify error code and type
  t.is(error.code, 'ENONPMTOKEN');
  t.true(error instanceof SemanticReleaseError);
});

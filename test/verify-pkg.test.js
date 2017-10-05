import test from 'ava';
import SemanticReleaseError from '@semantic-release/error';
import verify from '../src/lib/verify-pkg';

test.only('Verify name and repository', t => {
  // Call the verify module with package
  t.notThrows(() => verify({name: 'package', repository: {url: 'http://github.com/whats/up.git'}}));
});

test.only('Return error for missing package name', t => {
  // Call the verify module with package
  const error = t.throws(() => verify({repository: {url: 'http://github.com/whats/up.git'}}));
  // Verify error code and type
  t.is(error.code, 'ENOPKGNAME');
  t.true(error instanceof SemanticReleaseError);
});

test.only('Return error for missing repository', t => {
  // Call the verify module with package
  const error = t.throws(() => verify({name: 'package'}));
  // Verify error code and type
  t.is(error.code, 'ENOPKGREPO');
  t.true(error instanceof SemanticReleaseError);
});

test.only('Return error for missing repository url', t => {
  // Call the verify module with package
  const error = t.throws(() => verify({name: 'package', repository: {}}));
  // Verify error code and type
  t.is(error.code, 'ENOPKGREPO');
  t.true(error instanceof SemanticReleaseError);
});

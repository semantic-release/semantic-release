import test from 'ava';
import verify from '../src/lib/verify';

test('Dry run - Verify pkg, options and env', t => {
  // Call the verify module with debug (Dry run), package name and repo URL
  const errors = verify({
    options: {debug: true},
    pkg: {name: 'package', repository: {url: 'http://github.com/whats/up.git'}},
  });

  // Verify no error has been returned
  t.is(errors.length, 0);
});

test('Dry run - Returns errors for missing package name and repo', t => {
  // Call the verify module with debug (Dry run), no package name and no repo URL
  const errors = verify({options: {debug: true}, pkg: {}});

  // Verify the module return an error for each missing configuration
  t.is(errors.length, 2);
  t.is(errors[0].code, 'ENOPKGNAME');
  t.is(errors[1].code, 'ENOPKGREPO');
});

test('Dry run - Verify pkg, options and env for gitlab repo', t => {
  // Call the verify module with debug (Dry run), no package name and no repo URL
  const errors = verify({
    options: {debug: true},
    pkg: {name: 'package', repository: {url: 'http://gitlab.corp.com/whats/up.git'}},
  });

  // Verify no error has been returned
  t.is(errors.length, 0);
});

test('Publish - Verify pkg, options and env', t => {
  // Call the verify module with package name, repo URL, npm token and github token
  const errors = verify({
    env: {NPM_TOKEN: 'yo'},
    options: {githubToken: 'sup'},
    pkg: {name: 'package', repository: {url: 'http://github.com/whats/up.git'}},
  });

  // Verify no error has been returned
  t.is(errors.length, 0);
});

test('Publish - Returns errors for missing package name, repo github token and npm token', t => {
  // Call the verify module with no package name, no repo URL, no NPM token and no github token
  const errors = verify({env: {}, options: {}, pkg: {}});

  // Verify the module return an error for each missing configuration
  t.is(errors.length, 4);
  t.is(errors[0].code, 'ENOPKGNAME');
  t.is(errors[1].code, 'ENOPKGREPO');
  t.is(errors[2].code, 'ENOGHTOKEN');
  t.is(errors[3].code, 'ENONPMTOKEN');
});

test('Publish - Returns errors for missing email when using legacy npm token', t => {
  // Call the verify module with package name, repo URL, old NPM token and github token and no npm email
  const errors = verify({
    env: {NPM_OLD_TOKEN: 'yo'},
    options: {githubToken: 'sup'},
    pkg: {name: 'package', repository: {url: 'http://github.com/whats/up.git'}},
  });

  // Verify the module return an error for each missing configuration
  t.is(errors.length, 1);
  t.is(errors[0].code, 'ENONPMTOKEN');
});

import test from 'ava';
import tempy from 'tempy';
import verify from '../lib/verify';
import {gitRepo} from './helpers/git-utils';

test('Throw a AggregateError', async t => {
  const {cwd} = await gitRepo();
  const options = {};

  const errors = [...(await t.throws(verify({cwd, options})))];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'ENOREPOURL');
  t.is(errors[1].name, 'SemanticReleaseError');
  t.is(errors[1].code, 'EINVALIDTAGFORMAT');
  t.is(errors[2].name, 'SemanticReleaseError');
  t.is(errors[2].code, 'ETAGNOVERSION');
});

test('Throw a SemanticReleaseError if does not run on a git repository', async t => {
  const cwd = tempy.directory();
  const options = {};

  const errors = [...(await t.throws(verify({cwd, options})))];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'ENOGITREPO');
});

test('Throw a SemanticReleaseError if the "tagFormat" is not valid', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  const options = {repositoryUrl, tagFormat: `?\${version}`};

  const errors = [...(await t.throws(verify({cwd, options})))];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'EINVALIDTAGFORMAT');
});

test('Throw a SemanticReleaseError if the "tagFormat" does not contains the "version" variable', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  const options = {repositoryUrl, tagFormat: 'test'};

  const errors = [...(await t.throws(verify({cwd, options})))];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'ETAGNOVERSION');
});

test('Throw a SemanticReleaseError if the "tagFormat" contains multiple "version" variables', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  const options = {repositoryUrl, tagFormat: `\${version}v\${version}`};

  const errors = [...(await t.throws(verify({cwd, options})))];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'ETAGNOVERSION');
});

test('Return "true" if all verification pass', async t => {
  const {cwd, repositoryUrl} = await gitRepo(true);
  const options = {repositoryUrl, tagFormat: `v\${version}`};

  await t.notThrows(verify({cwd, options}));
});

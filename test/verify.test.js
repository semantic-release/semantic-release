import test from 'ava';
import {stub} from 'sinon';
import tempy from 'tempy';
import verify from '../lib/verify';
import {gitRepo} from './helpers/git-utils';

// Save the current process.env
const envBackup = Object.assign({}, process.env);
// Save the current working diretory
const cwd = process.cwd();

test.beforeEach(t => {
  // Delete environment variables that could have been set on the machine running the tests
  delete process.env.GIT_CREDENTIALS;
  delete process.env.GH_TOKEN;
  delete process.env.GITHUB_TOKEN;
  delete process.env.GL_TOKEN;
  delete process.env.GITLAB_TOKEN;
  // Stub the logger functions
  t.context.log = stub();
  t.context.error = stub();
  t.context.logger = {log: t.context.log, error: t.context.error};
});

test.afterEach.always(() => {
  // Restore process.env
  process.env = envBackup;
  // Restore the current working directory
  process.chdir(cwd);
});

test.serial('Return "false" if does not run on a git repository', async t => {
  const dir = tempy.directory();
  process.chdir(dir);

  t.false(await verify({}, 'master', t.context.logger));
});

test.serial('Throw a AggregateError', async t => {
  await gitRepo();

  const errors = Array.from(await t.throws(verify({}, 'master', t.context.logger)));

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].message, 'The repositoryUrl option is required');
  t.is(errors[0].code, 'ENOREPOURL');
  t.is(errors[1].name, 'SemanticReleaseError');
  t.is(errors[1].message, 'The tagFormat template must compile to a valid Git tag format');
  t.is(errors[1].code, 'EINVALIDTAGFORMAT');
  t.is(errors[2].name, 'SemanticReleaseError');
  t.is(errors[2].message, `The tagFormat template must contain the variable "\${version}" exactly once`);
  t.is(errors[2].code, 'ETAGNOVERSION');
});

test.serial('Throw a SemanticReleaseError if the "tagFormat" is not valid', async t => {
  const repositoryUrl = await gitRepo(true);
  const options = {repositoryUrl, tagFormat: `?\${version}`};

  const errors = Array.from(await t.throws(verify(options, 'master', t.context.logger)));

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].message, 'The tagFormat template must compile to a valid Git tag format');
  t.is(errors[0].code, 'EINVALIDTAGFORMAT');
});

test.serial('Throw a SemanticReleaseError if the "tagFormat" does not contains the "version" variable', async t => {
  const repositoryUrl = await gitRepo(true);
  const options = {repositoryUrl, tagFormat: 'test'};

  const errors = Array.from(await t.throws(verify(options, 'master', t.context.logger)));

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].message, `The tagFormat template must contain the variable "\${version}" exactly once`);
  t.is(errors[0].code, 'ETAGNOVERSION');
});

test.serial('Throw a SemanticReleaseError if the "tagFormat" contains multiple "version" variables', async t => {
  const repositoryUrl = await gitRepo(true);
  const options = {repositoryUrl, tagFormat: `\${version}v\${version}`};

  const errors = Array.from(await t.throws(verify(options, 'master', t.context.logger)));

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].message, `The tagFormat template must contain the variable "\${version}" exactly once`);
  t.is(errors[0].code, 'ETAGNOVERSION');
});

test.serial('Return "false" if the current branch is not the once configured', async t => {
  const repositoryUrl = await gitRepo(true);
  const options = {repositoryUrl, tagFormat: `v\${version}`, branch: 'master'};

  t.false(await verify(options, 'other', t.context.logger));
});

test.serial('Return "true" if all verification pass', async t => {
  const repositoryUrl = await gitRepo(true);
  const options = {repositoryUrl, tagFormat: `v\${version}`, branch: 'master'};

  t.true(await verify(options, 'master', t.context.logger));
});

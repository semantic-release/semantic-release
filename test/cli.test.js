import test from 'ava';
import proxyquire from 'proxyquire';
import clearModule from 'clear-module';
import {stub} from 'sinon';

// Save the current process.env and process.argv
const envBackup = Object.assign({}, process.env);
const argvBackup = Object.assign({}, process.argv);

test.beforeEach(t => {
  clearModule('yargs');
  t.context.logs = '';
  t.context.errors = '';
  t.context.stdout = stub(process.stdout, 'write').callsFake(val => {
    t.context.logs += val.toString();
  });
  t.context.stderr = stub(process.stderr, 'write').callsFake(val => {
    t.context.errors += val.toString();
  });
});

test.afterEach.always(t => {
  process.env = envBackup;
  process.argv = argvBackup;
  t.context.stdout.restore();
  t.context.stderr.restore();
  delete process.exitCode;
});

test.serial('Pass options to semantic-release API', async t => {
  const run = stub().resolves(true);
  const cli = proxyquire('../cli', {'.': run});

  process.argv = [
    '',
    '',
    '-b',
    'master',
    '-r',
    'https://github/com/owner/repo.git',
    '-t',
    `v\${version}`,
    '-e',
    'config1',
    'config2',
    '--verify-conditions',
    'condition1',
    'condition2',
    '--analyze-commits',
    'analyze',
    '--verify-release',
    'verify1',
    'verify2',
    '--generate-notes',
    'notes',
    '--prepare',
    'prepare1',
    'prepare2',
    '--publish',
    'publish1',
    'publish2',
    '--success',
    'success1',
    'success2',
    '--fail',
    'fail1',
    'fail2',
    '--debug',
    '-d',
  ];

  await cli();

  t.is(run.args[0][0].branch, 'master');
  t.is(run.args[0][0].repositoryUrl, 'https://github/com/owner/repo.git');
  t.is(run.args[0][0].tagFormat, `v\${version}`);
  t.deepEqual(run.args[0][0].extends, ['config1', 'config2']);
  t.deepEqual(run.args[0][0].verifyConditions, ['condition1', 'condition2']);
  t.is(run.args[0][0].analyzeCommits, 'analyze');
  t.deepEqual(run.args[0][0].verifyRelease, ['verify1', 'verify2']);
  t.is(run.args[0][0].generateNotes, 'notes');
  t.deepEqual(run.args[0][0].prepare, ['prepare1', 'prepare2']);
  t.deepEqual(run.args[0][0].publish, ['publish1', 'publish2']);
  t.deepEqual(run.args[0][0].success, ['success1', 'success2']);
  t.deepEqual(run.args[0][0].fail, ['fail1', 'fail2']);
  t.is(run.args[0][0].debug, true);
  t.is(run.args[0][0].dryRun, true);

  t.is(process.exitCode, 0);
});

test.serial('Pass options to semantic-release API with alias arguments', async t => {
  const run = stub().resolves(true);
  const cli = proxyquire('../cli', {'.': run});

  process.argv = [
    '',
    '',
    '--branch',
    'master',
    '--repository-url',
    'https://github/com/owner/repo.git',
    '--tag-format',
    `v\${version}`,
    '--extends',
    'config1',
    'config2',
    '--dry-run',
  ];

  await cli();

  t.is(run.args[0][0].branch, 'master');
  t.is(run.args[0][0].repositoryUrl, 'https://github/com/owner/repo.git');
  t.is(run.args[0][0].tagFormat, `v\${version}`);
  t.deepEqual(run.args[0][0].extends, ['config1', 'config2']);
  t.is(run.args[0][0].dryRun, true);

  t.is(process.exitCode, 0);
});

test.serial('Pass unknown options to semantic-release API', async t => {
  const run = stub().resolves(true);
  const cli = proxyquire('../cli', {'.': run});

  process.argv = [
    '',
    '',
    '--bool',
    '--first-option',
    'value1',
    '--second-option',
    'value2',
    '--second-option',
    'value3',
  ];

  await cli();

  t.is(run.args[0][0].bool, true);
  t.is(run.args[0][0].firstOption, 'value1');
  t.deepEqual(run.args[0][0].secondOption, ['value2', 'value3']);

  t.is(process.exitCode, 0);
});

test.serial('Pass empty Array to semantic-release API for list option set to "false"', async t => {
  const run = stub().resolves(true);
  const cli = proxyquire('../cli', {'.': run});

  process.argv = ['', '', '--publish', 'false'];

  await cli();

  t.deepEqual(run.args[0][0].publish, []);

  t.is(process.exitCode, 0);
});

test.serial('Do not set properties in option for which arg is not in command line', async t => {
  const run = stub().resolves(true);
  const cli = proxyquire('../cli', {'.': run});

  process.argv = ['', '', '-b', 'master'];

  await cli();

  t.false(Reflect.apply(Object.prototype.hasOwnProperty, run.args[0][0], ['ci']));
  t.false(Reflect.apply(Object.prototype.hasOwnProperty, run.args[0][0], ['d']));
  t.false(Reflect.apply(Object.prototype.hasOwnProperty, run.args[0][0], ['dry-run']));
  t.false(Reflect.apply(Object.prototype.hasOwnProperty, run.args[0][0], ['debug']));
  t.false(Reflect.apply(Object.prototype.hasOwnProperty, run.args[0][0], ['r']));
  t.false(Reflect.apply(Object.prototype.hasOwnProperty, run.args[0][0], ['t']));
});

test.serial('Set "noCi" options to "true" with "--no-ci"', async t => {
  const run = stub().resolves(true);
  const cli = proxyquire('../cli', {'.': run});

  process.argv = ['', '', '--no-ci'];

  await cli();

  t.is(run.args[0][0].noCi, true);

  t.is(process.exitCode, 0);
});

test.serial('Display help', async t => {
  const run = stub().resolves(true);
  const cli = proxyquire('../cli', {'.': run});

  process.argv = ['', '', '--help'];

  await cli();

  t.regex(t.context.logs, /Run automated package publishing/);
  t.is(process.exitCode, 0);
});

test.serial('Returns error code and prints help if called with a command', async t => {
  const run = stub().resolves(true);
  const cli = proxyquire('../cli', {'.': run});

  process.argv = ['', '', 'pre'];

  await cli();

  t.regex(t.context.errors, /Run automated package publishing/);
  t.regex(t.context.errors, /Too many non-option arguments/);
  t.is(process.exitCode, 1);
});

test.serial('Return error code if multiple plugin are set for single plugin', async t => {
  const run = stub().resolves(true);
  const cli = proxyquire('../cli', {'.': run});

  process.argv = ['', '', '--analyze-commits', 'analyze1', 'analyze2'];

  await cli();

  t.regex(t.context.errors, /Run automated package publishing/);
  t.regex(t.context.errors, /Too many non-option arguments/);
  t.is(process.exitCode, 1);
});

test.serial('Return error code if semantic-release throw error', async t => {
  const run = stub().rejects(new Error('semantic-release error'));
  const cli = proxyquire('../cli', {'.': run});

  process.argv = ['', ''];

  await cli();

  t.regex(t.context.errors, /semantic-release error/);
  t.is(process.exitCode, 1);
});

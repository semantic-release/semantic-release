import test from 'ava';
import {escapeRegExp} from 'lodash';
import proxyquire from 'proxyquire';
import {stub} from 'sinon';
import {SECRET_REPLACEMENT} from '../lib/definitions/constants';

const requireNoCache = proxyquire.noPreserveCache();

test.beforeEach(t => {
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
  t.context.stdout.restore();
  t.context.stderr.restore();
});

test.serial('Pass options to semantic-release API', async t => {
  const run = stub().resolves(true);
  const argv = [
    '',
    '',
    '-b',
    'master',
    'next',
    '-r',
    'https://github/com/owner/repo.git',
    '-t',
    `v\${version}`,
    '-p',
    'plugin1',
    'plugin2',
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
  const cli = requireNoCache('../cli', {'.': run, process: {...process, argv}});

  const exitCode = await cli();

  t.deepEqual(run.args[0][0].branches, ['master', 'next']);
  t.is(run.args[0][0].repositoryUrl, 'https://github/com/owner/repo.git');
  t.is(run.args[0][0].tagFormat, `v\${version}`);
  t.deepEqual(run.args[0][0].plugins, ['plugin1', 'plugin2']);
  t.deepEqual(run.args[0][0].extends, ['config1', 'config2']);
  t.deepEqual(run.args[0][0].verifyConditions, ['condition1', 'condition2']);
  t.is(run.args[0][0].analyzeCommits, 'analyze');
  t.deepEqual(run.args[0][0].verifyRelease, ['verify1', 'verify2']);
  t.deepEqual(run.args[0][0].generateNotes, ['notes']);
  t.deepEqual(run.args[0][0].prepare, ['prepare1', 'prepare2']);
  t.deepEqual(run.args[0][0].publish, ['publish1', 'publish2']);
  t.deepEqual(run.args[0][0].success, ['success1', 'success2']);
  t.deepEqual(run.args[0][0].fail, ['fail1', 'fail2']);
  t.is(run.args[0][0].debug, true);
  t.is(run.args[0][0].dryRun, true);

  t.is(exitCode, 0);
});

test.serial('Pass options to semantic-release API with alias arguments', async t => {
  const run = stub().resolves(true);
  const argv = [
    '',
    '',
    '--branches',
    'master',
    '--repository-url',
    'https://github/com/owner/repo.git',
    '--tag-format',
    `v\${version}`,
    '--plugins',
    'plugin1',
    'plugin2',
    '--extends',
    'config1',
    'config2',
    '--dry-run',
  ];
  const cli = requireNoCache('../cli', {'.': run, process: {...process, argv}});

  const exitCode = await cli();

  t.deepEqual(run.args[0][0].branches, ['master']);
  t.is(run.args[0][0].repositoryUrl, 'https://github/com/owner/repo.git');
  t.is(run.args[0][0].tagFormat, `v\${version}`);
  t.deepEqual(run.args[0][0].plugins, ['plugin1', 'plugin2']);
  t.deepEqual(run.args[0][0].extends, ['config1', 'config2']);
  t.is(run.args[0][0].dryRun, true);

  t.is(exitCode, 0);
});

test.serial('Pass unknown options to semantic-release API', async t => {
  const run = stub().resolves(true);
  const argv = ['', '', '--bool', '--first-option', 'value1', '--second-option', 'value2', '--second-option', 'value3'];
  const cli = requireNoCache('../cli', {'.': run, process: {...process, argv}});

  const exitCode = await cli();

  t.is(run.args[0][0].bool, true);
  t.is(run.args[0][0].firstOption, 'value1');
  t.deepEqual(run.args[0][0].secondOption, ['value2', 'value3']);

  t.is(exitCode, 0);
});

test.serial('Pass empty Array to semantic-release API for list option set to "false"', async t => {
  const run = stub().resolves(true);
  const argv = ['', '', '--publish', 'false'];
  const cli = requireNoCache('../cli', {'.': run, process: {...process, argv}});

  const exitCode = await cli();

  t.deepEqual(run.args[0][0].publish, []);

  t.is(exitCode, 0);
});

test.serial('Do not set properties in option for which arg is not in command line', async t => {
  const run = stub().resolves(true);
  const argv = ['', '', '-b', 'master'];
  const cli = requireNoCache('../cli', {'.': run, process: {...process, argv}});

  await cli();

  t.false('ci' in run.args[0][0]);
  t.false('d' in run.args[0][0]);
  t.false('dry-run' in run.args[0][0]);
  t.false('debug' in run.args[0][0]);
  t.false('r' in run.args[0][0]);
  t.false('t' in run.args[0][0]);
  t.false('p' in run.args[0][0]);
  t.false('e' in run.args[0][0]);
});

test.serial('Set "noCi" options to "true" with "--no-ci"', async t => {
  const run = stub().resolves(true);
  const argv = ['', '', '--no-ci'];
  const cli = requireNoCache('../cli', {'.': run, process: {...process, argv}});

  const exitCode = await cli();

  t.is(run.args[0][0].noCi, true);

  t.is(exitCode, 0);
});

test.serial('Display help', async t => {
  const run = stub().resolves(true);
  const argv = ['', '', '--help'];
  const cli = requireNoCache('../cli', {'.': run, process: {...process, argv}});

  const exitCode = await cli();

  t.regex(t.context.logs, /Run automated package publishing/);
  t.is(exitCode, 0);
});

test.serial('Return error code and prints help if called with a command', async t => {
  const run = stub().resolves(true);
  const argv = ['', '', 'pre'];
  const cli = requireNoCache('../cli', {'.': run, process: {...process, argv}});

  const exitCode = await cli();

  t.regex(t.context.errors, /Run automated package publishing/);
  t.regex(t.context.errors, /Too many non-option arguments/);
  t.is(exitCode, 1);
});

test.serial('Return error code if multiple plugin are set for single plugin', async t => {
  const run = stub().resolves(true);
  const argv = ['', '', '--analyze-commits', 'analyze1', 'analyze2'];
  const cli = requireNoCache('../cli', {'.': run, process: {...process, argv}});

  const exitCode = await cli();

  t.regex(t.context.errors, /Run automated package publishing/);
  t.regex(t.context.errors, /Too many non-option arguments/);
  t.is(exitCode, 1);
});

test.serial('Return error code if semantic-release throw error', async t => {
  const run = stub().rejects(new Error('semantic-release error'));
  const argv = ['', ''];
  const cli = requireNoCache('../cli', {'.': run, process: {...process, argv}});

  const exitCode = await cli();

  t.regex(t.context.errors, /semantic-release error/);
  t.is(exitCode, 1);
});

test.serial('Hide sensitive environment variable values from the logs', async t => {
  const env = {MY_TOKEN: 'secret token'};
  const run = stub().rejects(new Error(`Throw error: Exposing token ${env.MY_TOKEN}`));
  const argv = ['', ''];
  const cli = requireNoCache('../cli', {'.': run, process: {...process, argv, env: {...process.env, ...env}}});

  const exitCode = await cli();

  t.regex(t.context.errors, new RegExp(`Throw error: Exposing token ${escapeRegExp(SECRET_REPLACEMENT)}`));
  t.is(exitCode, 1);
});

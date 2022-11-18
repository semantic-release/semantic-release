const test = require('ava');
const {escapeRegExp} = require('lodash');
const td = require('testdouble');
const {stub} = require('sinon');
const {SECRET_REPLACEMENT} = require('../lib/definitions/constants');

let previousArgv;
let previousEnv;

test.beforeEach((t) => {
  t.context.logs = '';
  t.context.errors = '';
  t.context.stdout = stub(process.stdout, 'write').callsFake((value) => {
    t.context.logs += value.toString();
  });
  t.context.stderr = stub(process.stderr, 'write').callsFake((value) => {
    t.context.errors += value.toString();
  });

  previousArgv = process.argv;
  previousEnv = process.env;
});

test.afterEach.always((t) => {
  t.context.stdout.restore();
  t.context.stderr.restore();

  process.argv = previousArgv;
  process.env = previousEnv;
});

test.serial('Pass options to semantic-release API', async (t) => {
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
    '--allow-outdated-branch',
  ];
  td.replace('..', run);
  process.argv = argv;
  const cli = require('../cli');

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
  t.is(run.args[0][0].allowOutdatedBranch, true);

  t.is(exitCode, 0);
});

test.serial('Pass options to semantic-release API with alias arguments', async (t) => {
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
  td.replace('..', run);
  process.argv = argv;
  const cli = require('../cli');

  const exitCode = await cli();

  t.deepEqual(run.args[0][0].branches, ['master']);
  t.is(run.args[0][0].repositoryUrl, 'https://github/com/owner/repo.git');
  t.is(run.args[0][0].tagFormat, `v\${version}`);
  t.deepEqual(run.args[0][0].plugins, ['plugin1', 'plugin2']);
  t.deepEqual(run.args[0][0].extends, ['config1', 'config2']);
  t.is(run.args[0][0].dryRun, true);

  t.is(exitCode, 0);
});

test.serial('Pass unknown options to semantic-release API', async (t) => {
  const run = stub().resolves(true);
  const argv = ['', '', '--bool', '--first-option', 'value1', '--second-option', 'value2', '--second-option', 'value3'];
  td.replace('..', run);
  process.argv = argv;
  const cli = require('../cli');

  const exitCode = await cli();

  t.is(run.args[0][0].bool, true);
  t.is(run.args[0][0].firstOption, 'value1');
  t.deepEqual(run.args[0][0].secondOption, ['value2', 'value3']);

  t.is(exitCode, 0);
});

test.serial('Pass empty Array to semantic-release API for list option set to "false"', async (t) => {
  const run = stub().resolves(true);
  const argv = ['', '', '--publish', 'false'];
  td.replace('..', run);
  process.argv = argv;
  const cli = require('../cli');

  const exitCode = await cli();

  t.deepEqual(run.args[0][0].publish, []);

  t.is(exitCode, 0);
});

test.serial('Do not set properties in option for which arg is not in command line', async (t) => {
  const run = stub().resolves(true);
  const argv = ['', '', '-b', 'master'];
  td.replace('..', run);
  process.argv = argv;
  const cli = require('../cli');

  await cli();

  t.false('allow-outdated-branch' in run.args[0][0]);
  t.false('ci' in run.args[0][0]);
  t.false('d' in run.args[0][0]);
  t.false('dry-run' in run.args[0][0]);
  t.false('debug' in run.args[0][0]);
  t.false('r' in run.args[0][0]);
  t.false('t' in run.args[0][0]);
  t.false('p' in run.args[0][0]);
  t.false('e' in run.args[0][0]);
});

test.serial('Display help', async (t) => {
  const run = stub().resolves(true);
  const argv = ['', '', '--help'];
  td.replace('..', run);
  process.argv = argv;
  const cli = require('../cli');

  const exitCode = await cli();

  t.regex(t.context.logs, /Run automated package publishing/);
  t.is(exitCode, 0);
});

test.serial('Return error exitCode and prints help if called with a command', async (t) => {
  const run = stub().resolves(true);
  const argv = ['', '', 'pre'];
  td.replace('..', run);
  process.argv = argv;
  const cli = require('../cli');

  const exitCode = await cli();

  t.regex(t.context.errors, /Run automated package publishing/);
  t.regex(t.context.errors, /Too many non-option arguments/);
  t.is(exitCode, 1);
});

test.serial('Return error exitCode if multiple plugin are set for single plugin', async (t) => {
  const run = stub().resolves(true);
  const argv = ['', '', '--analyze-commits', 'analyze1', 'analyze2'];
  td.replace('..', run);
  process.argv = argv;
  const cli = require('../cli');

  const exitCode = await cli();

  t.regex(t.context.errors, /Run automated package publishing/);
  t.regex(t.context.errors, /Too many non-option arguments/);
  t.is(exitCode, 1);
});

test.serial('Return error exitCode if semantic-release throw error', async (t) => {
  const run = stub().rejects(new Error('semantic-release error'));
  const argv = ['', ''];
  td.replace('..', run);
  process.argv = argv;
  const cli = require('../cli');

  const exitCode = await cli();

  t.regex(t.context.errors, /semantic-release error/);
  t.is(exitCode, 1);
});

test.serial('Hide sensitive environment variable values from the logs', async (t) => {
  const env = {MY_TOKEN: 'secret token'};
  const run = stub().rejects(new Error(`Throw error: Exposing token ${env.MY_TOKEN}`));
  const argv = ['', ''];
  td.replace('..', run);
  process.argv = argv;
  process.env = {...process.env, ...env};
  const cli = require('../cli');

  const exitCode = await cli();

  t.regex(t.context.errors, new RegExp(`Throw error: Exposing token ${escapeRegExp(SECRET_REPLACEMENT)}`));
  t.is(exitCode, 1);
});

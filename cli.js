const {pickBy, isUndefined} = require('lodash');

const stringList = {
  type: 'string',
  array: true,
  coerce: values =>
    values.length === 1 && values[0].trim() === 'false'
      ? []
      : values.reduce((values, value) => values.concat(value.split(',').map(value => value.trim())), []),
};

module.exports = async () => {
  const cli = require('yargs')
    .command('$0', 'Run automated package publishing', yargs => {
      yargs.demandCommand(0, 0).usage(`Run automated package publishing
Usage:
  semantic-release [options] [plugins]`);
    })
    .option('b', {alias: 'branch', describe: 'Git branch to release from', type: 'string', group: 'Options'})
    .option('r', {alias: 'repository-url', describe: 'Git repository URL', type: 'string', group: 'Options'})
    .option('t', {alias: 'tag-format', describe: 'Git tag format', type: 'string', group: 'Options'})
    .option('e', {alias: 'extends', describe: 'Shareable configurations', ...stringList, group: 'Options'})
    .option('ci', {describe: 'Toggle CI verifications', default: true, type: 'boolean', group: 'Options'})
    .option('verify-conditions', {...stringList, group: 'Plugins'})
    .option('analyze-commits', {type: 'string', group: 'Plugins'})
    .option('verify-release', {...stringList, group: 'Plugins'})
    .option('generate-notes', {type: 'string', group: 'Plugins'})
    .option('publish', {...stringList, group: 'Plugins'})
    .option('success', {...stringList, group: 'Plugins'})
    .option('fail', {...stringList, group: 'Plugins'})
    .option('debug', {describe: 'Output debugging information', default: false, type: 'boolean', group: 'Options'})
    .option('d', {alias: 'dry-run', describe: 'Skip publishing', default: false, type: 'boolean', group: 'Options'})
    .option('h', {alias: 'help', group: 'Options'})
    .option('v', {alias: 'version', group: 'Options'})
    .strict(false)
    .exitProcess(false);

  try {
    const {help, version, ...opts} = cli.argv;
    if (Boolean(help) || Boolean(version)) {
      process.exitCode = 0;
      return;
    }

    // Set the `noCi` options as yargs sets the `ci` options instead (because arg starts with `--no`)
    if (opts.ci === false) {
      opts.noCi = true;
    }

    if (opts.debug) {
      // Debug must be enabled before other requires in order to work
      require('debug').enable('semantic-release:*');
    }

    // Remove option with undefined values, as yargs sets non defined options as `undefined`
    await require('.')(pickBy(opts, value => !isUndefined(value)));
    process.exitCode = 0;
  } catch (err) {
    if (err.name !== 'YError') {
      console.error(err);
    }
    process.exitCode = 1;
  }
};

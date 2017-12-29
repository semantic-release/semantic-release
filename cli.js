const program = require('commander');
const {pickBy, isUndefined} = require('lodash');
const logger = require('./lib/logger');

function list(values) {
  return values.split(',').map(value => value.trim());
}

module.exports = async () => {
  program
    .name('semantic-release')
    .description('Run automated package publishing')
    .option('-b, --branch <branch>', 'Branch to release from')
    .option('-r, --repositoryUrl <repositoryUrl>', 'Git repository URL')
    .option('-e, --extends <paths>', 'Comma separated list of shareable config paths or packages name', list)
    .option(
      '--verify-conditions <paths>',
      'Comma separated list of paths or packages name for the verifyConditions plugin(s)',
      list
    )
    .option('--get-last-release <path>', 'Path or package name for the getLastRelease plugin')
    .option('--analyze-commits <path>', 'Path or package name for the analyzeCommits plugin')
    .option(
      '--verify-release <paths>',
      'Comma separated list of paths or packages name for the verifyRelease plugin(s)',
      list
    )
    .option('--generate-notes <path>', 'Path or package name for the generateNotes plugin')
    .option('--publish <paths>', 'Comma separated list of paths or packages name for the publish plugin(s)', list)
    .option('--debug', 'Output debugging information')
    .option(
      '-d, --dry-run',
      'Dry-run mode, skipping verifyConditions, publishing and release, printing next version and release notes'
    )
    .parse(process.argv);

  if (program.debug) {
    // Debug must be enabled before other requires in order to work
    require('debug').enable('semantic-release:*');
  }

  try {
    if (program.args.length > 0) {
      program.outputHelp();
      process.exitCode = 1;
    } else {
      // Remove option with undefined values, as commander.js sets non defined options as `undefined`
      await require('.')(pickBy(program.opts(), value => !isUndefined(value)));
    }
  } catch (err) {
    process.exitCode = 1;
    if (err.semanticRelease) {
      logger.log(`%s ${err.message}`, err.code);
    } else {
      logger.error('An error occurred while running semantic-release: %O', err);
    }
  }
};

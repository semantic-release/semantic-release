const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const SemanticReleaseError = require('@semantic-release/error');
const {gitHead: getGitHead} = require('./lib/git');
const getConfig = require('./lib/get-config');
const getNextVersion = require('./lib/get-next-version');
const getCommits = require('./lib/get-commits');
const logger = require('./lib/logger');

module.exports = async opts => {
  const config = await getConfig(opts, logger);
  const {plugins, env, options, pkg} = config;

  logger.log('Run automated release for branch %s', options.branch);

  if (!options.dryRun) {
    logger.log('Call plugin %s', 'verify-conditions');
    await plugins.verifyConditions({env, options, pkg, logger});
  }

  logger.log('Call plugin %s', 'get-last-release');
  const {commits, lastRelease} = await getCommits(
    await plugins.getLastRelease({env, options, pkg, logger}),
    options.branch,
    logger
  );

  logger.log('Call plugin %s', 'analyze-commits');
  const type = await plugins.analyzeCommits({env, options, pkg, logger, lastRelease, commits});
  if (!type) {
    throw new SemanticReleaseError('There are no relevant changes, so no new version is released.', 'ENOCHANGE');
  }
  const version = getNextVersion(type, lastRelease, logger);
  const nextRelease = {type, version, gitHead: await getGitHead(), gitTag: `v${version}`};

  logger.log('Call plugin %s', 'verify-release');
  await plugins.verifyRelease({env, options, pkg, logger, lastRelease, commits, nextRelease});

  const generateNotesParam = {env, options, pkg, logger, lastRelease, commits, nextRelease};

  if (options.dryRun) {
    logger.log('Call plugin %s', 'generate-notes');
    const notes = await plugins.generateNotes(generateNotesParam);
    marked.setOptions({renderer: new TerminalRenderer()});
    logger.log('Release note for version %s:\n', nextRelease.version);
    process.stdout.write(`${marked(notes)}\n`);
  } else {
    logger.log('Call plugin %s', 'generateNotes');
    nextRelease.notes = await plugins.generateNotes(generateNotesParam);

    logger.log('Call plugin %s', 'publish');
    await plugins.publish({options, pkg, logger, lastRelease, commits, nextRelease}, async prevInput => {
      const newGitHead = await getGitHead();
      // If previous publish plugin has created a commit (gitHead changed)
      if (prevInput.nextRelease.gitHead !== newGitHead) {
        nextRelease.gitHead = newGitHead;
        // Regenerate the release notes
        logger.log('Call plugin %s', 'generateNotes');
        nextRelease.notes = await plugins.generateNotes(generateNotesParam);
      }
      // Call the next publish plugin with the updated `nextRelease`
      return {options, pkg, logger, lastRelease, commits, nextRelease};
    });
    logger.log('Published release: %s', nextRelease.version);
  }
};

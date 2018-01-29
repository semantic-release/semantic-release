const {template} = require('lodash');
const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const envCi = require('env-ci');
const hookStd = require('hook-std');
const hideSensitive = require('./lib/hide-sensitive');
const getConfig = require('./lib/get-config');
const verify = require('./lib/verify');
const getNextVersion = require('./lib/get-next-version');
const getCommits = require('./lib/get-commits');
const getLastRelease = require('./lib/get-last-release');
const logger = require('./lib/logger');
const {unshallow, gitHead: getGitHead, tag, push, deleteTag} = require('./lib/git');

async function run(opts) {
  const {isCi, branch, isPr} = envCi();
  const config = await getConfig(opts, logger);
  const {plugins, options} = config;

  if (!isCi && !options.dryRun && !options.noCi) {
    logger.log('This run was not triggered in a known CI environment, running in dry-run mode.');
    options.dryRun = true;
  }

  if (isCi && isPr && !options.noCi) {
    logger.log("This run was triggered by a pull request and therefore a new version won't be published.");
    return;
  }

  if (!await verify(options, branch, logger)) {
    return;
  }

  logger.log('Run automated release from branch %s', options.branch);

  logger.log('Call plugin %s', 'verify-conditions');
  await plugins.verifyConditions({options, logger}, true);

  // Unshallow the repo in order to get all the tags
  await unshallow();

  const lastRelease = await getLastRelease(options.tagFormat, logger);
  const commits = await getCommits(lastRelease.gitHead, options.branch, logger);

  logger.log('Call plugin %s', 'analyze-commits');
  const type = await plugins.analyzeCommits({
    options,
    logger,
    lastRelease,
    commits: commits.filter(commit => !/\[skip\s+release\]|\[release\s+skip\]/i.test(commit.message)),
  });
  if (!type) {
    logger.log('There are no relevant changes, so no new version is released.');
    return;
  }
  const version = getNextVersion(type, lastRelease, logger);
  const nextRelease = {type, version, gitHead: await getGitHead(), gitTag: template(options.tagFormat)({version})};

  logger.log('Call plugin %s', 'verify-release');
  await plugins.verifyRelease({options, logger, lastRelease, commits, nextRelease}, true);

  const generateNotesParam = {options, logger, lastRelease, commits, nextRelease};

  if (options.dryRun) {
    logger.log('Call plugin %s', 'generate-notes');
    const notes = await plugins.generateNotes(generateNotesParam);
    marked.setOptions({renderer: new TerminalRenderer()});
    logger.log('Release note for version %s:\n', nextRelease.version);
    process.stdout.write(`${marked(notes)}\n`);
  } else {
    logger.log('Call plugin %s', 'generateNotes');
    nextRelease.notes = await plugins.generateNotes(generateNotesParam);

    // Create the tag before calling the publish plugins as some require the tag to exists
    logger.log('Create tag %s', nextRelease.gitTag);
    await tag(nextRelease.gitTag);
    await push(options.repositoryUrl, branch);

    logger.log('Call plugin %s', 'publish');
    await plugins.publish({options, logger, lastRelease, commits, nextRelease}, false, async prevInput => {
      const newGitHead = await getGitHead();
      // If previous publish plugin has created a commit (gitHead changed)
      if (prevInput.nextRelease.gitHead !== newGitHead) {
        // Delete the previously created tag
        await deleteTag(options.repositoryUrl, nextRelease.gitTag);
        // Recreate the tag, referencing the new gitHead
        logger.log('Create tag %s', nextRelease.gitTag);
        await tag(nextRelease.gitTag);
        await push(options.repositoryUrl, branch);

        nextRelease.gitHead = newGitHead;
        // Regenerate the release notes
        logger.log('Call plugin %s', 'generateNotes');
        nextRelease.notes = await plugins.generateNotes(generateNotesParam);
      }
      // Call the next publish plugin with the updated `nextRelease`
      return {options, logger, lastRelease, commits, nextRelease};
    });
    logger.log('Published release: %s', nextRelease.version);
  }
  return true;
}

module.exports = async opts => {
  const unhook = hookStd({silent: false}, hideSensitive);
  try {
    const result = await run(opts);
    unhook();
    return result;
  } catch (err) {
    const errors = err.name === 'AggregateError' ? Array.from(err).sort(error => !error.semanticRelease) : [err];
    for (const error of errors) {
      if (error.semanticRelease) {
        logger.log(`%s ${error.message}`, error.code);
      } else {
        logger.error('An error occurred while running semantic-release: %O', error);
      }
    }
    unhook();
    throw err;
  }
};

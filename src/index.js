const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const SemanticReleaseError = require('@semantic-release/error');
const getConfig = require('./lib/get-config');
const getNextVersion = require('./lib/get-next-version');
const verifyPkg = require('./lib/verify-pkg');
const verifyAuth = require('./lib/verify-auth');
const getCommits = require('./lib/get-commits');
const publishNpm = require('./lib/publish-npm');
const githubRelease = require('./lib/github-release');
const logger = require('./lib/logger');

module.exports = async opts => {
  const config = await getConfig(opts);
  const {plugins, env, options, pkg, npm} = config;

  logger.log('Run automated release for %s on branch %s', pkg.name, options.branch);

  verifyPkg(pkg);
  if (!options.dryRun) {
    verifyAuth(options, env);
  }

  if (!options.dryRun) {
    logger.log('Call plugin %s', 'verify-conditions');
    await plugins.verifyConditions({env, options, pkg, npm, logger});
  }

  logger.log('Call plugin %s', 'get-last-release');
  const {commits, lastRelease} = await getCommits(
    await plugins.getLastRelease({env, options, pkg, npm, logger}),
    options.branch
  );

  logger.log('Call plugin %s', 'analyze-commits');
  const type = await plugins.analyzeCommits({env, options, pkg, npm, logger, lastRelease, commits});
  if (!type) {
    throw new SemanticReleaseError('There are no relevant changes, so no new version is released.', 'ENOCHANGE');
  }
  const nextRelease = {type, version: getNextVersion(type, lastRelease)};

  logger.log('Call plugin %s', 'verify-release');
  await plugins.verifyRelease({env, options, pkg, npm, logger, lastRelease, commits, nextRelease});

  if (!options.dryRun) {
    await publishNpm(pkg, npm, nextRelease);
  }

  logger.log('Call plugin %s', 'generate-notes');
  const notes = await plugins.generateNotes({env, options, pkg, npm, logger, lastRelease, commits, nextRelease});

  if (options.dryRun) {
    marked.setOptions({renderer: new TerminalRenderer()});
    logger.log('Release note for version %s:\n', nextRelease.version);
    console.log(marked(notes));
  } else {
    const releaseUrl = await githubRelease(pkg, notes, nextRelease.version, options);
    logger.log('Published Github release: %s', releaseUrl);
  }
};

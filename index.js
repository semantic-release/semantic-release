const {template} = require('lodash');
const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const envCi = require('env-ci');
const hookStd = require('hook-std');
const pkg = require('./package.json');
const hideSensitive = require('./lib/hide-sensitive');
const getConfig = require('./lib/get-config');
const verify = require('./lib/verify');
const getNextVersion = require('./lib/get-next-version');
const getCommits = require('./lib/get-commits');
const getLastRelease = require('./lib/get-last-release');
const {extractErrors} = require('./lib/utils');
const getGitAuthUrl = require('./lib/get-git-auth-url');
const logger = require('./lib/logger');
const {fetch, verifyAuth, isBranchUpToDate, gitHead: getGitHead, tag, push} = require('./lib/git');
const getError = require('./lib/get-error');
const {COMMIT_NAME, COMMIT_EMAIL} = require('./lib/definitions/constants');

marked.setOptions({renderer: new TerminalRenderer()});

async function run(options, plugins) {
  const {isCi, branch, isPr} = envCi();

  if (!isCi && !options.dryRun && !options.noCi) {
    logger.log('This run was not triggered in a known CI environment, running in dry-run mode.');
    options.dryRun = true;
  } else {
    // When running on CI, set the commits author and commiter info and prevent the `git` CLI to prompt for username/password. See #703.
    process.env = {
      GIT_AUTHOR_NAME: COMMIT_NAME,
      GIT_AUTHOR_EMAIL: COMMIT_EMAIL,
      GIT_COMMITTER_NAME: COMMIT_NAME,
      GIT_COMMITTER_EMAIL: COMMIT_EMAIL,
      ...process.env,
      GIT_ASKPASS: 'echo',
      GIT_TERMINAL_PROMPT: 0,
    };
  }

  if (isCi && isPr && !options.noCi) {
    logger.log("This run was triggered by a pull request and therefore a new version won't be published.");
    return;
  }

  if (branch !== options.branch) {
    logger.log(
      `This test run was triggered on the branch ${branch}, while semantic-release is configured to only publish from ${
        options.branch
      }, therefore a new version won’t be published.`
    );
    return false;
  }

  await verify(options);

  options.repositoryUrl = await getGitAuthUrl(options);

  try {
    await verifyAuth(options.repositoryUrl, options.branch);
  } catch (err) {
    if (!(await isBranchUpToDate(options.branch))) {
      logger.log(
        "The local branch %s is behind the remote one, therefore a new version won't be published.",
        options.branch
      );
      return false;
    }
    logger.error(`The command "${err.cmd}" failed with the error message %s.`, err.stderr);
    throw getError('EGITNOPERMISSION', {options});
  }

  logger.log('Run automated release from branch %s', options.branch);

  await plugins.verifyConditions({options, logger});

  await fetch(options.repositoryUrl);

  const lastRelease = await getLastRelease(options.tagFormat, logger);
  const commits = await getCommits(lastRelease.gitHead, options.branch, logger);

  const type = await plugins.analyzeCommits({options, logger, lastRelease, commits});
  if (!type) {
    logger.log('There are no relevant changes, so no new version is released.');
    return;
  }
  const version = getNextVersion(type, lastRelease, logger);
  const nextRelease = {type, version, gitHead: await getGitHead(), gitTag: template(options.tagFormat)({version})};

  await plugins.verifyRelease({options, logger, lastRelease, commits, nextRelease});

  const generateNotesParam = {options, logger, lastRelease, commits, nextRelease};

  if (options.dryRun) {
    const notes = await plugins.generateNotes(generateNotesParam);
    logger.log('Release note for version %s:\n', nextRelease.version);
    if (notes) {
      process.stdout.write(`${marked(notes)}\n`);
    }
  } else {
    nextRelease.notes = await plugins.generateNotes(generateNotesParam);
    await plugins.prepare({options, logger, lastRelease, commits, nextRelease});

    // Create the tag before calling the publish plugins as some require the tag to exists
    logger.log('Create tag %s', nextRelease.gitTag);
    await tag(nextRelease.gitTag);
    await push(options.repositoryUrl, branch);

    const releases = await plugins.publish({options, logger, lastRelease, commits, nextRelease});

    await plugins.success({options, logger, lastRelease, commits, nextRelease, releases});

    logger.log('Published release: %s', nextRelease.version);
  }
  return true;
}

function logErrors(err) {
  const errors = extractErrors(err).sort(error => (error.semanticRelease ? -1 : 0));
  for (const error of errors) {
    if (error.semanticRelease) {
      logger.log(`%s ${error.message}`, error.code);
      if (error.details) {
        process.stdout.write(`${marked(error.details)}\n`);
      }
    } else {
      logger.error('An error occurred while running semantic-release: %O', error);
    }
  }
}

async function callFail(plugins, options, error) {
  const errors = extractErrors(error).filter(error => error.semanticRelease);
  if (errors.length > 0) {
    try {
      await plugins.fail({options, logger, errors});
    } catch (err) {
      logErrors(err);
    }
  }
}

module.exports = async opts => {
  logger.log(`Running %s version %s`, pkg.name, pkg.version);
  const {unhook} = hookStd({silent: false}, hideSensitive);
  try {
    const config = await getConfig(opts, logger);
    const {plugins, options} = config;
    try {
      const result = await run(options, plugins);
      unhook();
      return result;
    } catch (err) {
      if (!options.dryRun) {
        await callFail(plugins, options, err);
      }
      throw err;
    }
  } catch (err) {
    logErrors(err);
    unhook();
    throw err;
  }
};

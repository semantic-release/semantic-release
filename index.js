const process = require('process');
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

async function run(context, plugins) {
  const {isCi, branch: ciBranch, isPr} = envCi();
  const {cwd, env, options, logger} = context;

  if (!isCi && !options.dryRun && !options.noCi) {
    logger.log('This run was not triggered in a known CI environment, running in dry-run mode.');
    options.dryRun = true;
  } else {
    // When running on CI, set the commits author and commiter info and prevent the `git` CLI to prompt for username/password. See #703.
    Object.assign(env, {
      GIT_AUTHOR_NAME: COMMIT_NAME,
      GIT_AUTHOR_EMAIL: COMMIT_EMAIL,
      GIT_COMMITTER_NAME: COMMIT_NAME,
      GIT_COMMITTER_EMAIL: COMMIT_EMAIL,
      ...env,
      GIT_ASKPASS: 'echo',
      GIT_TERMINAL_PROMPT: 0,
    });
  }

  if (isCi && isPr && !options.noCi) {
    logger.log("This run was triggered by a pull request and therefore a new version won't be published.");
    return;
  }

  if (ciBranch !== options.branch) {
    logger.log(
      `This test run was triggered on the branch ${ciBranch}, while semantic-release is configured to only publish from ${
        options.branch
      }, therefore a new version won’t be published.`
    );
    return false;
  }

  await verify(context);

  options.repositoryUrl = await getGitAuthUrl(context);

  try {
    await verifyAuth(options.repositoryUrl, options.branch, {cwd, env});
  } catch (err) {
    if (!(await isBranchUpToDate(options.branch, {cwd, env}))) {
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

  await plugins.verifyConditions(context);

  await fetch(options.repositoryUrl, {cwd, env});

  context.lastRelease = await getLastRelease(context);
  context.commits = await getCommits(context);

  const nextRelease = {type: await plugins.analyzeCommits(context), gitHead: await getGitHead({cwd, env})};

  if (!nextRelease.type) {
    logger.log('There are no relevant changes, so no new version is released.');
    return;
  }
  context.nextRelease = nextRelease;
  nextRelease.version = getNextVersion(context);
  nextRelease.gitTag = template(options.tagFormat)({version: nextRelease.version});

  await plugins.verifyRelease(context);

  if (options.dryRun) {
    const notes = await plugins.generateNotes(context);
    logger.log('Release note for version %s:\n', nextRelease.version);
    if (notes) {
      logger.stdout(`${marked(notes)}\n`);
    }
  } else {
    nextRelease.notes = await plugins.generateNotes(context);
    await plugins.prepare(context);

    // Create the tag before calling the publish plugins as some require the tag to exists
    logger.log('Create tag %s', nextRelease.gitTag);
    await tag(nextRelease.gitTag, {cwd, env});
    await push(options.repositoryUrl, options.branch, {cwd, env});

    context.releases = await plugins.publish(context);

    await plugins.success(context);

    logger.log('Published release: %s', nextRelease.version);
  }
  return true;
}

function logErrors({logger}, err) {
  const errors = extractErrors(err).sort(error => (error.semanticRelease ? -1 : 0));
  for (const error of errors) {
    if (error.semanticRelease) {
      logger.log(`%s ${error.message}`, error.code);
      if (error.details) {
        logger.stderr(`${marked(error.details)}\n`);
      }
    } else {
      logger.error('An error occurred while running semantic-release: %O', error);
    }
  }
}

async function callFail(context, plugins, error) {
  const errors = extractErrors(error).filter(error => error.semanticRelease);
  if (errors.length > 0) {
    try {
      await plugins.fail({...context, errors});
    } catch (err) {
      logErrors(context, err);
    }
  }
}

module.exports = async (opts, {cwd = process.cwd(), env = process.env} = {}) => {
  const context = {cwd, env, logger};
  context.logger.log(`Running %s version %s`, pkg.name, pkg.version);
  const {unhook} = hookStd({silent: false}, hideSensitive(context.env));
  try {
    const {plugins, options} = await getConfig(context, opts);
    context.options = options;
    try {
      const result = await run(context, plugins);
      unhook();
      return result;
    } catch (err) {
      if (!options.dryRun) {
        await callFail(context, plugins, err);
      }
      throw err;
    }
  } catch (err) {
    logErrors(context, err);
    unhook();
    throw err;
  }
};

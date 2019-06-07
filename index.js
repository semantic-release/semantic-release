const {template, pick} = require('lodash');
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
const getLogger = require('./lib/get-logger');
const {fetch, verifyAuth, isBranchUpToDate, getGitHead, tag, push} = require('./lib/git');
const getError = require('./lib/get-error');
const {COMMIT_NAME, COMMIT_EMAIL} = require('./lib/definitions/constants');

marked.setOptions({renderer: new TerminalRenderer()});

async function run(context, plugins) {
  const {cwd, env, options, logger} = context;
  const {isCi, branch: ciBranch, isPr} = envCi({env, cwd});

  if (!isCi && !options.dryRun && !options.noCi) {
    logger.warn('This run was not triggered in a known CI environment, running in dry-run mode.');
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
    return false;
  }

  if (ciBranch !== options.branch) {
    logger.log(
      `This test run was triggered on the branch ${ciBranch}, while semantic-release is configured to only publish from ${options.branch}, therefore a new version won’t be published.`
    );
    return false;
  }

  logger[options.dryRun ? 'warn' : 'success'](
    `Run automated release from branch ${ciBranch}${options.dryRun ? ' in dry-run mode' : ''}`
  );

  await verify(context);

  options.repositoryUrl = await getGitAuthUrl(context);

  try {
    try {
      await verifyAuth(options.repositoryUrl, options.branch, {cwd, env});
    } catch (error) {
      if (!(await isBranchUpToDate(options.branch, {cwd, env}))) {
        logger.log(
          `The local branch ${options.branch} is behind the remote one, therefore a new version won't be published.`
        );
        return false;
      }

      throw error;
    }
  } catch (error) {
    logger.error(`The command "${error.cmd}" failed with the error message ${error.stderr}.`);
    throw getError('EGITNOPERMISSION', {options});
  }

  logger.success(`Allowed to push to the Git repository`);

  await plugins.verifyConditions(context);

  await fetch(options.repositoryUrl, {cwd, env});

  context.lastRelease = await getLastRelease(context);
  context.commits = await getCommits(context);

  const nextRelease = {type: await plugins.analyzeCommits(context), gitHead: await getGitHead({cwd, env})};

  if (!nextRelease.type) {
    logger.log('There are no relevant changes, so no new version is released.');
    return false;
  }

  context.nextRelease = nextRelease;
  nextRelease.version = getNextVersion(context);
  nextRelease.gitTag = template(options.tagFormat)({version: nextRelease.version});

  await plugins.verifyRelease(context);

  nextRelease.notes = await plugins.generateNotes(context);

  await plugins.prepare(context);

  if (options.dryRun) {
    logger.warn(`Skip ${nextRelease.gitTag} tag creation in dry-run mode`);
  } else {
    // Create the tag before calling the publish plugins as some require the tag to exists
    await tag(nextRelease.gitTag, {cwd, env});
    await push(options.repositoryUrl, {cwd, env});
    logger.success(`Created tag ${nextRelease.gitTag}`);
  }

  context.releases = await plugins.publish(context);

  await plugins.success(context);

  logger.success(`Published release ${nextRelease.version}`);

  if (options.dryRun) {
    logger.log(`Release note for version ${nextRelease.version}:`);
    if (nextRelease.notes) {
      context.stdout.write(marked(nextRelease.notes));
    }
  }

  return pick(context, ['lastRelease', 'commits', 'nextRelease', 'releases']);
}

function logErrors({logger, stderr}, err) {
  const errors = extractErrors(err).sort(error => (error.semanticRelease ? -1 : 0));
  for (const error of errors) {
    if (error.semanticRelease) {
      logger.error(`${error.code} ${error.message}`);
      if (error.details) {
        stderr.write(marked(error.details));
      }
    } else {
      logger.error('An error occurred while running semantic-release: %O', error);
    }
  }
}

async function callFail(context, plugins, err) {
  const errors = extractErrors(err).filter(err => err.semanticRelease);
  if (errors.length > 0) {
    try {
      await plugins.fail({...context, errors});
    } catch (error) {
      logErrors(context, error);
    }
  }
}

module.exports = async (opts = {}, {cwd = process.cwd(), env = process.env, stdout, stderr} = {}) => {
  const {unhook} = hookStd(
    {silent: false, streams: [process.stdout, process.stderr, stdout, stderr].filter(Boolean)},
    hideSensitive(env)
  );
  const context = {cwd, env, stdout: stdout || process.stdout, stderr: stderr || process.stderr};
  context.logger = getLogger(context);
  context.logger.log(`Running ${pkg.name} version ${pkg.version}`);
  try {
    const {plugins, options} = await getConfig(context, opts);
    context.options = options;
    try {
      const result = await run(context, plugins);
      unhook();
      return result;
    } catch (error) {
      await callFail(context, plugins, error);
      throw error;
    }
  } catch (error) {
    logErrors(context, error);
    unhook();
    throw error;
  }
};

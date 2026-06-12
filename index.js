import semanticReleaseCore, { resolveConfig, getLogger, resolveEnvCi } from "@semantic-release/core";
import * as marked from "marked";
import { COMMIT_EMAIL, COMMIT_NAME, SEMANTIC_RELEASE_DEFAULT_CONFIG } from "./lib/definitions/constants.js";

import pkg from "./package.json" with { type: "json" };

let markedOptionsSet = false;
async function terminalOutput(text) {
  if (!markedOptionsSet) {
    const { default: TerminalRenderer } = await import("marked-terminal"); // eslint-disable-line node/no-unsupported-features/es-syntax
    marked.setOptions({ renderer: new TerminalRenderer() });
    markedOptionsSet = true;
  }

  return marked.parse(text);
}

export default async (
  cliOptions = {},
  { cwd = process.cwd(), env = process.env, stdout = process.stdout, stderr = process.stderr } = {}
) => {
  const envCiResult = resolveEnvCi({ env, cwd });
  const { isCi, branch, prBranch, isPr } = envCiResult;
  const ciBranch = isPr ? prBranch : branch;
  const noCi = Boolean(cliOptions.noCi || cliOptions.ci === false);

  const shouldAutoDryRun = !isCi && !cliOptions.dryRun && !noCi;
  const effectiveCliOptions = shouldAutoDryRun ? { ...cliOptions, dryRun: true } : cliOptions;
  const shouldSkipRelease = isCi && isPr && !noCi;

  if (!shouldAutoDryRun) {
    // Preserve git non-interactive behavior and bot identity outside of the auto dry-run path.
    Object.assign(env, {
      GIT_AUTHOR_NAME: COMMIT_NAME,
      GIT_AUTHOR_EMAIL: COMMIT_EMAIL,
      GIT_COMMITTER_NAME: COMMIT_NAME,
      GIT_COMMITTER_EMAIL: COMMIT_EMAIL,
      ...env,
      GIT_ASKPASS: "echo",
      GIT_TERMINAL_PROMPT: 0,
    });
  }

  const context = {
    cwd,
    env,
    stdout,
    stderr,
    envCi: envCiResult,
  };

  context.logger = getLogger(context);

  context.logger.log(`Running ${pkg.name} version ${pkg.version}`);
  if (shouldAutoDryRun) {
    context.logger.warn("This run was not triggered in a known CI environment, running in dry-run mode.");
  }

  if (shouldSkipRelease) {
    context.logger.log("This run was triggered by a pull request and therefore a new version won't be published.");
    return false;
  }

  const { options: resolvedOptions, plugins } = await resolveConfig(context, effectiveCliOptions, {
    baseConfig: SEMANTIC_RELEASE_DEFAULT_CONFIG,
    buildPlugins: true,
  });
  resolvedOptions.originalRepositoryURL = resolvedOptions.repositoryUrl;
  context.options = resolvedOptions;

  const result = await semanticReleaseCore({ context, plugins, formatOutput: terminalOutput });

  return result;
};

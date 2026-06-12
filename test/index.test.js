import test from "ava";
import * as td from "testdouble";

const SEMANTIC_RELEASE_DEFAULT_CONFIG = {
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/github",
  ],
};

test.afterEach.always(() => {
  td.reset();
});

test.serial("wrapper forwards environment params and delegates to core", async (t) => {
  const core = await td.replaceEsm("@semantic-release/core");

  const logger = { log: td.func("log"), warn: td.func("warn") };
  const plugins = { verifyConditions: td.func("verifyConditions") };
  const resolvedOptions = { repositoryUrl: "https://example.com/repo.git", dryRun: true };
  const env = {};
  const stdout = { write: td.func("stdout.write") };
  const stderr = { write: td.func("stderr.write") };

  td.when(core.default(td.matchers.isA(Object))).thenResolve({ ok: true });
  td.when(core.resolveEnvCi(td.matchers.isA(Object))).thenReturn({ isCi: true, branch: "next", isPr: false });
  td.when(core.getLogger(td.matchers.isA(Object))).thenReturn(logger);
  td.when(core.resolveConfig(td.matchers.isA(Object), td.matchers.isA(Object), td.matchers.isA(Object))).thenResolve({
    plugins,
    options: resolvedOptions,
  });

  const semanticRelease = (await import("../index.js")).default;

  const result = await semanticRelease({ dryRun: true }, { cwd: process.cwd(), env, stdout, stderr });

  const [{ args }] = td.explain(core.default).calls;
  const [callArg] = args;
  const { context, plugins: receivedPlugins } = callArg;

  const [{ args: resolveConfigArgs }] = td.explain(core.resolveConfig).calls;
  const [, , configOptions] = resolveConfigArgs;

  t.deepEqual(receivedPlugins, plugins);
  t.is(typeof callArg.formatOutput, "function");
  t.deepEqual(configOptions, { baseConfig: SEMANTIC_RELEASE_DEFAULT_CONFIG, buildPlugins: true });
  t.is(context.envCi.branch, "next");
  t.is(context.cwd, process.cwd());
  t.is(context.env, env);
  t.is(context.stdout, stdout);
  t.is(context.stderr, stderr);
  t.is(context.options.originalRepositoryURL, resolvedOptions.repositoryUrl);

  td.verify(logger.log(td.matchers.contains("Running semantic-release version")));

  const formatted = await callArg.formatOutput("## Title");
  t.true(formatted.includes("Title"));
  t.deepEqual(result, { ok: true });
});

test.serial("wrapper computes dry-run policy upstream before calling core", async (t) => {
  const core = await td.replaceEsm("@semantic-release/core");
  const logger = { log: td.func("log"), warn: td.func("warn") };

  td.when(core.default(td.matchers.isA(Object))).thenResolve(true);
  td.when(core.resolveEnvCi(td.matchers.isA(Object))).thenReturn({ isCi: false, branch: "next", isPr: false });
  td.when(core.getLogger(td.matchers.isA(Object))).thenReturn(logger);
  td.when(core.resolveConfig(td.matchers.isA(Object), td.matchers.isA(Object), td.matchers.isA(Object))).thenResolve({
    plugins: {},
    options: { repositoryUrl: "https://example.com/repo.git", dryRun: true },
  });

  const semanticRelease = (await import("../index.js")).default;
  await semanticRelease({});

  const [{ args }] = td.explain(core.default).calls;
  const [callArg] = args;
  const { context } = callArg;

  t.false("skipRelease" in context);
  td.verify(logger.warn("This run was not triggered in a known CI environment, running in dry-run mode."));
});

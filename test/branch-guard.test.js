import test from "ava";
import { stub } from "sinon";
import branchGuard from "../lib/branch-guard.js";
import { TAG_PROBE_REF } from "../lib/git.js";
import { PROCEED, SKIP, UNAUTHORIZED } from "../lib/monorepo.js";
import { gitCommitFiles, gitPush, gitRepo, gitShallowClone, gitTagVersion } from "./helpers/git-utils.js";

// The probe pushes `HEAD` to this tag, so occupying it on the remote with another commit is how a rejected
// tag push is reproduced without a real remote.
const PROBE_TAG = TAG_PROBE_REF.replace("refs/tags/", "");

test.beforeEach((t) => {
  t.context.log = stub();
  t.context.warn = stub();
  t.context.logger = { log: t.context.log, warn: t.context.warn };
});

const context = (t, cwd, options = {}) => ({ cwd, env: {}, logger: t.context.logger, options });

/**
 * Create a repository whose local branch is one commit behind its remote, with the remote commit touching
 * `path`.
 */
const behindRepo = async (path) => {
  let { cwd, repositoryUrl } = await gitRepo(true);
  const local = cwd;
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  cwd = await gitShallowClone(repositoryUrl);
  await gitCommitFiles({ [path]: "changed" }, "feat: remote", { cwd });
  await gitPush("origin", "master", { cwd });

  return { cwd: local, repositoryUrl };
};

test("Skip the release when behind without the monorepo option", async (t) => {
  const { cwd, repositoryUrl } = await behindRepo("packages/a/other.js");

  const result = await branchGuard(context(t, cwd), { repositoryUrl, branch: "master" });

  t.is(result, SKIP);
  t.deepEqual(t.context.log.args[0], [
    "The local branch master is behind the remote one, therefore a new version won't be published.",
  ]);
  t.is(t.context.warn.callCount, 0);
});

test("Report an unauthorized push when up to date without the monorepo option", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  const result = await branchGuard(context(t, cwd), { repositoryUrl, branch: "master" });

  t.is(result, UNAUTHORIZED);
  t.is(t.context.log.callCount, 0);
  t.is(t.context.warn.callCount, 0);
});

test("Skip the release when the missing changes affect the path", async (t) => {
  const { cwd, repositoryUrl } = await behindRepo("packages/a/other.js");

  const result = await branchGuard(context(t, cwd, { monorepo: { paths: ["packages/a"] } }), {
    repositoryUrl,
    branch: "master",
  });

  t.is(result, SKIP);
  t.is(t.context.log.callCount, 1);
  t.true(t.context.log.args[0][0].includes("packages/a"));
  t.is(t.context.warn.callCount, 0);
});

test("Proceed when the missing changes are outside the path", async (t) => {
  const { cwd, repositoryUrl } = await behindRepo("packages/b/index.js");

  const result = await branchGuard(context(t, cwd, { monorepo: { paths: ["packages/a"] } }), {
    repositoryUrl,
    branch: "master",
  });

  t.is(result, PROCEED);
  t.is(t.context.warn.callCount, 1);
  t.true(t.context.warn.args[0][0].includes("packages/a"));
  t.is(t.context.log.callCount, 0);
});

test("Proceed when up to date with a configured path and a pushable tag", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  const result = await branchGuard(context(t, cwd, { monorepo: { paths: ["packages/a"] } }), {
    repositoryUrl,
    branch: "master",
  });

  t.is(result, PROCEED);
  t.is(t.context.warn.callCount, 1);
});

test("Report an unauthorized push when the tag cannot be pushed", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  // Occupy the probed tag on the remote with another commit: git rejects updating an existing tag without a
  // force, so the tag push is refused while the branch stays up to date.
  await gitTagVersion(PROBE_TAG, "HEAD^", { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  const result = await branchGuard(context(t, cwd, { monorepo: { paths: ["packages/a"] } }), {
    repositoryUrl,
    branch: "master",
  });

  t.is(result, UNAUTHORIZED);
  t.is(t.context.warn.callCount, 0);
});

test("Skip the release when the missing changes are inside a second configured path", async (t) => {
  const { cwd, repositoryUrl } = await behindRepo("shared/proto/index.proto");

  const result = await branchGuard(context(t, cwd, { monorepo: { paths: ["packages/a", "shared/proto"] } }), {
    repositoryUrl,
    branch: "master",
  });

  t.is(result, SKIP);
  t.is(t.context.warn.callCount, 0);
  t.is(t.context.log.callCount, 1);
  t.true(t.context.log.args[0][0].includes("packages/a, shared/proto"));
});

import test from "ava";
import { stub } from "sinon";
import getCommits from "../lib/get-commits.js";
import { gitCommitFiles, gitCommits, gitDetachedHead, gitPush, gitRepo, gitShallowClone } from "./helpers/git-utils.js";

test.beforeEach((t) => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.error = stub();
  t.context.logger = { log: t.context.log, error: t.context.error };
});

test("Get all commits when there is no last release", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(["First", "Second"], { cwd });

  // Retrieve the commits with the commits module
  const result = await getCommits({ cwd, lastRelease: {}, logger: t.context.logger });

  // Verify the commits created and retrieved by the module are identical
  t.is(result.length, 2);
  t.deepEqual(result, commits);
});

test("Get all commits since gitHead (from lastRelease)", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(["First", "Second", "Third"], { cwd });

  // Retrieve the commits with the commits module, since commit 'First'
  const result = await getCommits({
    cwd,
    lastRelease: { gitHead: commits[commits.length - 1].hash },
    logger: t.context.logger,
  });

  // Verify the commits created and retrieved by the module are identical
  t.is(result.length, 2);
  t.deepEqual(result, commits.slice(0, 2));
});

test("Get all commits since gitHead (from lastRelease) on a detached head repo", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  let { cwd, repositoryUrl } = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(["First", "Second", "Third"], { cwd });
  // Create a detached head repo at commit 'feat: Second'
  cwd = await gitDetachedHead(repositoryUrl, commits[1].hash);

  // Retrieve the commits with the commits module, since commit 'First'
  const result = await getCommits({
    cwd,
    lastRelease: { gitHead: commits[commits.length - 1].hash },
    logger: t.context.logger,
  });

  // Verify the module retrieved only the commit 'feat: Second' (included in the detached and after 'fix: First')
  t.is(result.length, 1);
  t.is(result[0].hash, commits[1].hash);
  t.is(result[0].message, commits[1].message);
  t.truthy(result[0].committerDate);
  t.truthy(result[0].author.name);
  t.truthy(result[0].committer.name);
});

test("Get all commits between lastRelease.gitHead and a shas", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(["First", "Second", "Third"], { cwd });

  // Retrieve the commits with the commits module, between commit 'First' and 'Third'
  const result = await getCommits({
    cwd,
    lastRelease: { gitHead: commits[commits.length - 1].hash },
    nextRelease: { gitHead: commits[1].hash },
    logger: t.context.logger,
  });

  // Verify the commits created and retrieved by the module are identical
  t.is(result.length, 1);
  t.deepEqual(result, commits.slice(1, -1));
});

test("Return empty array if lastRelease.gitHead is the last commit", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(["First", "Second"], { cwd });

  // Retrieve the commits with the commits module, since commit 'Second' (therefore none)
  const result = await getCommits({
    cwd,
    lastRelease: { gitHead: commits[0].hash },
    logger: t.context.logger,
  });

  // Verify no commit is retrieved
  t.deepEqual(result, []);
});

test("Return empty array if there is no commits", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();

  // Retrieve the commits with the commits module
  const result = await getCommits({ cwd, lastRelease: {}, logger: t.context.logger });

  // Verify no commit is retrieved
  t.deepEqual(result, []);
});

test("Keep only the commits affecting the configured path", async (t) => {
  const { cwd } = await gitRepo();
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  const bar = await gitCommitFiles({ "packages/b/index.js": "b" }, "feat: b", { cwd });
  await gitCommitFiles({ "packages/a/other.js": "a" }, "fix: a", { cwd });

  const result = await getCommits({
    cwd,
    lastRelease: {},
    logger: t.context.logger,
    options: { monorepo: { paths: ["packages/a"] } },
  });

  t.is(result.length, 2);
  t.false(result.some(({ hash }) => hash === bar.hash));
  t.true(result.every(({ message }) => message.startsWith("feat: a") || message.startsWith("fix: a")));
});

test("Keep a commit that touches the path alongside other paths", async (t) => {
  const { cwd } = await gitRepo();
  await gitCommitFiles({ "packages/a/index.js": "a", "packages/b/index.js": "b" }, "feat: both", { cwd });
  await gitCommitFiles({ "packages/b/other.js": "b" }, "feat: only b", { cwd });

  const result = await getCommits({
    cwd,
    lastRelease: {},
    logger: t.context.logger,
    options: { monorepo: { paths: ["packages/a"] } },
  });

  t.is(result.length, 1);
  t.is(result[0].message, "feat: both");
});

test("Drop an empty commit that affects no path", async (t) => {
  const { cwd } = await gitRepo();
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitCommits(["chore: trigger ci"], { cwd });

  const result = await getCommits({
    cwd,
    lastRelease: {},
    logger: t.context.logger,
    options: { monorepo: { paths: ["packages/a"] } },
  });

  t.is(result.length, 1);
  t.is(result[0].message, "feat: a");
});

test("Keep a commit whose attribution is impossible in a shallow clone", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitCommitFiles({ "packages/a/other.js": "a" }, "fix: a", { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  // Depth 2 gives one commit with a local parent (attributable, and filtered out) and one boundary commit
  // without a parent (not attributable). The boundary commit is kept even though `packages/other` is not
  // in its tree: dropping it would silently suppress the release.
  const shallow = await gitShallowClone(repositoryUrl, "master", 2);

  const result = await getCommits({
    cwd: shallow,
    lastRelease: {},
    logger: t.context.logger,
    options: { monorepo: { paths: ["packages/other"] } },
  });

  t.is(result.length, 1);
  t.is(result[0].message, "feat: a");
});

test("Filter the commits of a release to add", async (t) => {
  // The release-to-add path calls `getCommits` with an explicit range, which must filter too
  const { cwd } = await gitRepo();
  const first = await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitCommitFiles({ "packages/b/index.js": "b" }, "feat: b", { cwd });

  const result = await getCommits({
    cwd,
    lastRelease: { gitHead: first.hash },
    logger: t.context.logger,
    options: { monorepo: { paths: ["packages/a"] } },
  });

  t.is(result.length, 0);
});

test("Do not filter the commits without the monorepo option", async (t) => {
  const { cwd } = await gitRepo();
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitCommitFiles({ "packages/b/index.js": "b" }, "feat: b", { cwd });

  const result = await getCommits({ cwd, lastRelease: {}, logger: t.context.logger });

  t.is(result.length, 2);
});

test("Keep the commits affecting any of the configured paths", async (t) => {
  const { cwd } = await gitRepo();
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitCommitFiles({ "shared/proto/index.proto": "proto" }, "feat: proto", { cwd });
  await gitCommitFiles({ "packages/b/index.js": "b" }, "feat: b", { cwd });

  const result = await getCommits({
    cwd,
    lastRelease: {},
    logger: t.context.logger,
    options: { monorepo: { paths: ["packages/a", "shared/proto"] } },
  });

  const messages = result.map(({ message }) => message);
  t.true(messages.includes("feat: a"));
  t.true(messages.includes("feat: proto"));
  t.false(messages.includes("feat: b"));
});

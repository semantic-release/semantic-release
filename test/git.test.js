import { existsSync } from "node:fs";
import path from "node:path";
import test from "ava";
import { execa } from "execa";
import fsExtra from "fs-extra";
import { temporaryDirectory } from "tempy";
import {
  addNote,
  fetch,
  fetchNotes,
  getBranches,
  getBranchState,
  getChangedFilesSinceRemote,
  getCommitsFiles,
  getGitHead,
  getRepoPrefix,
  getTagHead,
  getTags,
  getTagsNotes,
  fetchRemoteTip,
  isBranchUpToDate,
  isGitRepo,
  isRefExists,
  push,
  repoUrl,
  tag,
  verifyTagName,
  verifyTagPush,
} from "../lib/git.js";
import {
  gitAddConfig,
  gitAddNote,
  gitCheckout,
  gitCommitFiles,
  gitCommits,
  gitCommitTag,
  gitDetachedHead,
  gitDetachedHeadFromBranch,
  gitFetch,
  gitFullClone,
  gitGetCommits,
  gitGetNote,
  gitPush,
  gitRemoteTagHead,
  gitRepo,
  gitShallowClone,
  gitTagVersion,
  initGit,
  merge,
} from "./helpers/git-utils.js";

test("Get the last commit sha", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(["First"], { cwd });

  const result = await getGitHead({ cwd });

  t.is(result, commits[0].hash);
});

test("Throw error if the last commit sha cannot be found", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();

  await t.throwsAsync(getGitHead({ cwd }));
});

test("Unshallow and fetch repository", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  let { cwd, repositoryUrl } = await gitRepo();
  // Add commits to the master branch
  await gitCommits(["First", "Second"], { cwd });
  // Create a shallow clone with only 1 commit
  cwd = await gitShallowClone(repositoryUrl);

  // Verify the shallow clone contains only one commit
  t.is((await gitGetCommits(undefined, { cwd })).length, 1);

  await fetch(repositoryUrl, "master", "master", { cwd });

  // Verify the shallow clone contains all the commits
  t.is((await gitGetCommits(undefined, { cwd })).length, 2);
});

test("Do not throw error when unshallow a complete repository", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommits(["First"], { cwd });
  await gitPush(repositoryUrl, "master", { cwd });
  await gitCheckout("second-branch", true, { cwd });
  await gitCommits(["Second"], { cwd });
  await gitPush(repositoryUrl, "second-branch", { cwd });

  await t.notThrowsAsync(fetch(repositoryUrl, "master", "master", { cwd }));
  await t.notThrowsAsync(fetch(repositoryUrl, "second-branch", "master", { cwd }));
});

test("Fetch all tags on a detached head repository", async (t) => {
  let { cwd, repositoryUrl } = await gitRepo();

  await gitCommits(["First"], { cwd });
  await gitTagVersion("v1.0.0", undefined, { cwd });
  await gitCommits(["Second"], { cwd });
  await gitTagVersion("v1.0.1", undefined, { cwd });
  const [commit] = await gitCommits(["Third"], { cwd });
  await gitTagVersion("v1.1.0", undefined, { cwd });
  await gitPush(repositoryUrl, "master", { cwd });
  cwd = await gitDetachedHead(repositoryUrl, commit.hash);

  await fetch(repositoryUrl, "master", "master", { cwd });

  t.deepEqual((await getTags("master", { cwd })).sort(), ["v1.0.0", "v1.0.1", "v1.1.0"].sort());
});

test("Fetch all tags on a repository with a detached head from branch (CircleCI)", async (t) => {
  let { cwd, repositoryUrl } = await gitRepo();

  await gitCommits(["First"], { cwd });
  await gitTagVersion("v1.0.0", undefined, { cwd });
  await gitCommits(["Second"], { cwd });
  await gitTagVersion("v1.0.1", undefined, { cwd });
  const [commit] = await gitCommits(["Third"], { cwd });
  await gitTagVersion("v1.1.0", undefined, { cwd });
  await gitPush(repositoryUrl, "master", { cwd });
  await gitCheckout("other-branch", true, { cwd });
  await gitPush(repositoryUrl, "other-branch", { cwd });
  await gitCheckout("master", false, { cwd });
  await gitCommits(["Fourth"], { cwd });
  await gitTagVersion("v2.0.0", undefined, { cwd });
  await gitPush(repositoryUrl, "master", { cwd });
  cwd = await gitDetachedHeadFromBranch(repositoryUrl, "other-branch", commit.hash);

  await fetch(repositoryUrl, "master", "other-branch", { cwd });
  await fetch(repositoryUrl, "other-branch", "other-branch", { cwd });

  t.deepEqual((await getTags("other-branch", { cwd })).sort(), ["v1.0.0", "v1.0.1", "v1.1.0"].sort());
  t.deepEqual((await getTags("master", { cwd })).sort(), ["v1.0.0", "v1.0.1", "v1.1.0", "v2.0.0"].sort());
});

test("Fetch all tags on a detached head repository with outdated cached repo (GitLab CI)", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo();

  await gitCommits(["First"], { cwd });
  await gitTagVersion("v1.0.0", undefined, { cwd });
  await gitCommits(["Second"], { cwd });
  await gitTagVersion("v1.0.1", undefined, { cwd });
  let [commit] = await gitCommits(["Third"], { cwd });
  await gitTagVersion("v1.1.0", undefined, { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  // Create a clone (as first CI run would)
  const cloneCwd = await gitShallowClone(repositoryUrl);
  await gitFetch(repositoryUrl, { cwd: cloneCwd });
  await gitCheckout(commit.hash, false, { cwd: cloneCwd });

  // Push tag to remote
  [commit] = await gitCommits(["Fourth"], { cwd });
  await gitTagVersion("v1.2.0", undefined, { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  // Fetch on the cached repo and make detached head, leaving master outdated
  await fetch(repositoryUrl, "master", "master", { cwd: cloneCwd });
  await gitCheckout(commit.hash, false, { cwd: cloneCwd });

  t.deepEqual((await getTags("master", { cwd: cloneCwd })).sort(), ["v1.0.0", "v1.0.1", "v1.1.0", "v1.2.0"].sort());
});

test("Verify if a branch exists", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Add commits to the master branch
  await gitCommits(["First"], { cwd });
  // Create the new branch 'other-branch' from master
  await gitCheckout("other-branch", true, { cwd });
  // Add commits to the 'other-branch' branch
  await gitCommits(["Second"], { cwd });

  t.true(await isRefExists("master", { cwd }));
  t.true(await isRefExists("other-branch", { cwd }));
  t.falsy(await isRefExists("next", { cwd }));
});

test("Get all branches", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommits(["First"], { cwd });
  await gitPush(repositoryUrl, "master", { cwd });
  await gitCheckout("second-branch", true, { cwd });
  await gitCommits(["Second"], { cwd });
  await gitPush(repositoryUrl, "second-branch", { cwd });
  await gitCheckout("third-branch", true, { cwd });
  await gitCommits(["Third"], { cwd });
  await gitPush(repositoryUrl, "third-branch", { cwd });

  t.deepEqual((await getBranches(repositoryUrl, { cwd })).sort(), ["master", "second-branch", "third-branch"].sort());
});

test("Return empty array if there are no branches", async (t) => {
  const { cwd, repositoryUrl } = await initGit(true);
  t.deepEqual(await getBranches(repositoryUrl, { cwd }), []);
});

test("Get the commit sha for a given tag", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(["First"], { cwd });
  // Create the tag corresponding to version 1.0.0
  await gitTagVersion("v1.0.0", undefined, { cwd });

  t.is(await getTagHead("v1.0.0", { cwd }), commits[0].hash);
});

test("Return git remote repository url from config", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Add remote.origin.url config
  await gitAddConfig("remote.origin.url", "git@hostname.com:owner/package.git", { cwd });

  t.is(await repoUrl({ cwd }), "git@hostname.com:owner/package.git");
});

test("Return git remote repository url set while cloning", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  let { cwd, repositoryUrl } = await gitRepo();
  await gitCommits(["First"], { cwd });
  // Create a clone
  cwd = await gitShallowClone(repositoryUrl);

  t.is(await repoUrl({ cwd }), repositoryUrl);
});

test("Return falsy if git repository url is not set", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();

  t.falsy(await repoUrl({ cwd }));
});

test("Add tag on head commit", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const commits = await gitCommits(["Test commit"], { cwd });

  await tag("tag_name", "HEAD", { cwd });

  await t.is(await gitCommitTag(commits[0].hash, { cwd }), "tag_name");
});

test("Push tag to remote repository", async (t) => {
  // Create a git repository with a remote, set the current working directory at the root of the repo
  const { cwd, repositoryUrl } = await gitRepo(true);
  const commits = await gitCommits(["Test commit"], { cwd });

  await tag("tag_name", "HEAD", { cwd });
  await push(repositoryUrl, { cwd });

  t.is(await gitRemoteTagHead(repositoryUrl, "tag_name", { cwd }), commits[0].hash);
});

test("Push tag to remote repository with remote branch ahead", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const commits = await gitCommits(["First"], { cwd });
  await gitPush(repositoryUrl, "master", { cwd });
  const temporaryRepo = await gitShallowClone(repositoryUrl);
  await gitCommits(["Second"], { cwd: temporaryRepo });
  await gitPush("origin", "master", { cwd: temporaryRepo });

  await tag("tag_name", "HEAD", { cwd });
  await push(repositoryUrl, { cwd });

  t.is(await gitRemoteTagHead(repositoryUrl, "tag_name", { cwd }), commits[0].hash);
});

test('Return "true" if in a Git repository', async (t) => {
  // Create a git repository with a remote, set the current working directory at the root of the repo
  const { cwd } = await gitRepo(true);

  t.true(await isGitRepo({ cwd }));
});

test("Return falsy if not in a Git repository", async (t) => {
  const cwd = temporaryDirectory();

  t.falsy(await isGitRepo({ cwd }));
});

test('Return "true" for valid tag names', async (t) => {
  t.true(await verifyTagName("1.0.0"));
  t.true(await verifyTagName("v1.0.0"));
  t.true(await verifyTagName("tag_name"));
  t.true(await verifyTagName("tag/name"));
});

test("Return falsy for invalid tag names", async (t) => {
  t.falsy(await verifyTagName("?1.0.0"));
  t.falsy(await verifyTagName("*1.0.0"));
  t.falsy(await verifyTagName("[1.0.0]"));
  t.falsy(await verifyTagName("1.0.0.."));
});

test("Throws error if obtaining the tags fails", async (t) => {
  const cwd = temporaryDirectory();

  await t.throwsAsync(getTags("master", { cwd }));
});

test('Return "true" if repository is up to date', async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommits(["First"], { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  t.true(await isBranchUpToDate(repositoryUrl, "master", { cwd }));
});

test("Return falsy if repository is not up to date", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommits(["First"], { cwd });
  await gitCommits(["Second"], { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  t.true(await isBranchUpToDate(repositoryUrl, "master", { cwd }));

  const temporaryRepo = await gitShallowClone(repositoryUrl);
  await gitCommits(["Third"], { cwd: temporaryRepo });
  await gitPush("origin", "master", { cwd: temporaryRepo });

  t.falsy(await isBranchUpToDate(repositoryUrl, "master", { cwd }));
});

test("Return falsy if detached head repository is not up to date", async (t) => {
  let { cwd, repositoryUrl } = await gitRepo();

  const [commit] = await gitCommits(["First"], { cwd });
  await gitCommits(["Second"], { cwd });
  await gitPush(repositoryUrl, "master", { cwd });
  cwd = await gitDetachedHead(repositoryUrl, commit.hash);
  await fetch(repositoryUrl, "master", "master", { cwd });

  t.falsy(await isBranchUpToDate(repositoryUrl, "master", { cwd }));
});

test("Get a commit note", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Add commits to the master branch
  await gitCommits(["First"], { cwd });
  await gitTagVersion("v1.0.0", undefined, { cwd });

  await gitAddNote(JSON.stringify({ note: "note" }), "v1.0.0", { cwd });
  const tagsNotes = await getTagsNotes({ cwd });

  t.deepEqual(tagsNotes.get("v1.0.0"), { note: "note" });
});

test("Return undefined if there is no commit note", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Add commits to the master branch
  await gitCommits(["First"], { cwd });
  await gitTagVersion("v1.0.0", undefined, { cwd });

  const tagsNotes = await getTagsNotes({ cwd });

  t.deepEqual(tagsNotes.get("v1.0.0"), undefined);
});

test("Return undefined if a commit note is invalid", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Add commits to the master branch
  await gitCommits(["First"], { cwd });
  await gitTagVersion("v1.0.0", undefined, { cwd });

  await gitAddNote("non-json note", "v1.0.0", { cwd });

  const tagsNotes = await getTagsNotes({ cwd });

  t.deepEqual(tagsNotes.get("v1.0.0"), undefined);
});

test("Add a commit note", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(["First"], { cwd });

  await addNote({ note: "note" }, commits[0].hash, { cwd });

  t.is(await gitGetNote(commits[0].hash, { cwd }), '{"note":"note"}');
});

test("Overwrite a commit note", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(["First"], { cwd });

  await addNote({ note: "note" }, commits[0].hash, { cwd });
  await addNote({ note: "note2" }, commits[0].hash, { cwd });

  t.is(await gitGetNote(commits[0].hash, { cwd }), '{"note":"note2"}');
});

test("Unshallow and fetch repository with notes", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  let { cwd, repositoryUrl } = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(["First", "Second"], { cwd });
  await gitAddNote(JSON.stringify({ note: "note" }), commits[0].hash, { cwd });
  // Create a shallow clone with only 1 commit
  cwd = await gitShallowClone(repositoryUrl);

  // Verify the shallow clone doesn't contains the note
  await t.throwsAsync(gitGetNote(commits[0].hash, { cwd }));

  await fetch(repositoryUrl, "master", "master", { cwd });
  await fetchNotes(repositoryUrl, { cwd });

  // Verify the shallow clone contains the note
  t.is(await gitGetNote(commits[0].hash, { cwd }), '{"note":"note"}');
});

test("Fetch all notes on a detached head repository", async (t) => {
  let { cwd, repositoryUrl } = await gitRepo();

  await gitCommits(["First"], { cwd });
  const [commit] = await gitCommits(["Second"], { cwd });
  await gitPush(repositoryUrl, "master", { cwd });
  await gitAddNote(JSON.stringify({ note: "note" }), commit.hash, { cwd });
  cwd = await gitDetachedHead(repositoryUrl, commit.hash);

  await fetch(repositoryUrl, "master", "master", { cwd });
  await fetchNotes(repositoryUrl, { cwd });

  t.is(await gitGetNote(commit.hash, { cwd }), '{"note":"note"}');
});

test("Does not execute a `repositoryUrl` injected as an `--upload-pack` git option", async (t) => {
  const { cwd } = await gitRepo();
  await gitCommits(["First"], { cwd });
  const marker = path.join(temporaryDirectory(), "upload-pack-rce");
  // A `repositoryUrl` beginning with `-` would be parsed by git as a
  // command-line option rather than a positional argument. `--upload-pack`
  // lets the injected value run an arbitrary binary when fetching refs.
  const repositoryUrl = `--upload-pack=touch ${marker}`;

  await t.throwsAsync(isBranchUpToDate(repositoryUrl, "master", { cwd }));

  t.false(existsSync(marker));
});

test("Does not execute a `repositoryUrl` injected as a `--receive-pack` git option", async (t) => {
  const { cwd } = await gitRepo(true);
  await gitCommits(["First"], { cwd });
  const marker = path.join(temporaryDirectory(), "receive-pack-rce");
  // `--receive-pack` is the push-side equivalent: it lets the injected value
  // run an arbitrary binary when pushing to the (configured) remote.
  const repositoryUrl = `--receive-pack=touch ${marker}`;

  await t.throwsAsync(push(repositoryUrl, { cwd }));

  t.false(existsSync(marker));
});

test("Get the repository relative prefix of the working directory", async (t) => {
  const { cwd } = await gitRepo();
  t.is(await getRepoPrefix({ cwd }), "");

  const subDirectory = path.resolve(cwd, "packages/api");
  await fsExtra.ensureDir(subDirectory);
  t.is(await getRepoPrefix({ cwd: subDirectory }), "packages/api/");
});

test("Get the repository relative prefix outside of a repository", async (t) => {
  t.is(await getRepoPrefix({ cwd: temporaryDirectory() }), "");
});

test("Get the state of a branch that is up to date", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommits(["First"], { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  const state = await getBranchState(repositoryUrl, "master", { cwd });

  t.is(state.localHead, state.remoteHead);
  t.true(state.upToDate);
});

test("Get the state of a branch that is behind", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommits(["First"], { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  const otherClone = await gitShallowClone(repositoryUrl);
  await gitCommits(["Second"], { cwd: otherClone });
  await gitPush("origin", "master", { cwd: otherClone });

  const state = await getBranchState(repositoryUrl, "master", { cwd });

  t.not(state.localHead, state.remoteHead);
  t.false(state.upToDate);
});

test("Fetch the remote tip into a dedicated reference", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  const otherClone = await gitShallowClone(repositoryUrl);
  await gitCommitFiles({ "packages/b/index.js": "b" }, "feat: b", { cwd: otherClone });
  await gitPush("origin", "master", { cwd: otherClone });

  const ref = await fetchRemoteTip(repositoryUrl, "master", { cwd });

  t.is(ref, "refs/semantic-release/upstream");
  t.is(
    (await execa("git", ["rev-parse", ref], { cwd })).stdout,
    (await execa("git", ["rev-parse", "HEAD"], { cwd: otherClone })).stdout
  );
});

test("Fetching the remote tip into a complete clone does not make it shallow", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  // A complete clone, as produced by `actions/checkout` with `fetch-depth: 0`
  const complete = await gitFullClone(repositoryUrl);
  const before = (await execa("git", ["rev-list", "--count", "HEAD"], { cwd: complete })).stdout;

  await fetchRemoteTip(repositoryUrl, "master", { cwd: complete });

  t.is((await execa("git", ["rev-parse", "--is-shallow-repository"], { cwd: complete })).stdout, "false");
  t.is((await execa("git", ["rev-list", "--count", "HEAD"], { cwd: complete })).stdout, before);
});

test("Get the files changed between the local head and the remote tip", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  const otherClone = await gitShallowClone(repositoryUrl);
  await gitCommitFiles({ "packages/b/index.js": "b" }, "feat: b", { cwd: otherClone });
  await gitCommitFiles({ "packages/a/other.js": "a" }, "fix: a", { cwd: otherClone });
  await gitPush("origin", "master", { cwd: otherClone });

  t.deepEqual((await getChangedFilesSinceRemote(repositoryUrl, "master", { cwd })).sort(), [
    "packages/a/other.js",
    "packages/b/index.js",
  ]);
});

test("Get the files changed between a diverged head and the remote tip", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  const otherClone = await gitShallowClone(repositoryUrl);
  await gitCommitFiles({ "packages/b/index.js": "b" }, "feat: b", { cwd: otherClone });
  await gitPush("origin", "master", { cwd: otherClone });

  // A local commit the remote does not have: the diff is symmetric, so the local change is reported
  // too. That makes a diverged branch skip the release, which is the conservative outcome.
  await gitCommitFiles({ "packages/a/local.js": "a" }, "fix: local", { cwd });

  t.deepEqual((await getChangedFilesSinceRemote(repositoryUrl, "master", { cwd })).sort(), [
    "packages/a/local.js",
    "packages/b/index.js",
  ]);
});

test("Return undefined when the remote tip cannot be fetched", async (t) => {
  const { cwd } = await gitRepo(true);
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });

  t.is(await getChangedFilesSinceRemote("file:///does/not/exist", "master", { cwd }), undefined);
});

test("Verify the tag push is accepted", async (t) => {
  const { cwd } = await gitRepo(true);
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });

  t.true(await verifyTagPush("origin", { cwd }));
});

test("Verify the tag push is rejected without credentials", async (t) => {
  const { cwd } = await gitRepo(true);
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });

  t.false(await verifyTagPush("file:///does/not/exist", { cwd }));
});

test("The tag push probe does not create a reference", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  await verifyTagPush(repositoryUrl, { cwd });

  t.is((await execa("git", ["ls-remote", "--tags", repositoryUrl], { cwd })).stdout.trim(), "");
});

test("Get the files of each commit", async (t) => {
  const { cwd } = await gitRepo();
  const first = await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  const second = await gitCommitFiles({ "packages/b/index.js": "b" }, "feat: b", { cwd });

  const filesByHash = await getCommitsFiles(undefined, "HEAD", { cwd });

  t.deepEqual(filesByHash.get(first.hash).files, ["packages/a/index.js"]);
  t.deepEqual(filesByHash.get(second.hash).files, ["packages/b/index.js"]);
  t.true(filesByHash.get(second.hash).hasParents);
});

test("Attribute a merge commit to its first parent", async (t) => {
  const { cwd } = await gitRepo();
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitCheckout("feature", true, { cwd });
  const feature = await gitCommitFiles({ "packages/b/index.js": "b" }, "feat: b", { cwd });
  await gitCheckout("master", false, { cwd });
  await gitCommitFiles({ "packages/a/other.js": "a" }, "fix: a", { cwd });
  await merge("feature", { cwd });

  const filesByHash = await getCommitsFiles(undefined, "HEAD", { cwd });
  const mergeHash = (await execa("git", ["rev-parse", "HEAD"], { cwd })).stdout;

  // The merge introduces the feature branch's change relative to its first parent
  t.deepEqual(filesByHash.get(mergeHash).files, ["packages/b/index.js"]);
  t.true(filesByHash.has(feature.hash));
});

test("Report an empty commit as having no files", async (t) => {
  const { cwd } = await gitRepo();
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitCommits(["chore: trigger ci"], { cwd });

  const filesByHash = await getCommitsFiles(undefined, "HEAD", { cwd });
  const empty = (await execa("git", ["rev-parse", "HEAD"], { cwd })).stdout;

  t.deepEqual(filesByHash.get(empty).files, []);
  t.true(filesByHash.get(empty).hasParents);
});

test("Report a grafted commit in a shallow clone as having no parent", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommitFiles({ "packages/a/index.js": "a" }, "feat: a", { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  const shallow = await gitShallowClone(repositoryUrl);
  const filesByHash = await getCommitsFiles(undefined, "HEAD", { cwd: shallow });
  const grafted = (await execa("git", ["rev-parse", "HEAD"], { cwd: shallow })).stdout;

  t.false(filesByHash.get(grafted).hasParents);
});

test("Return undefined when the commit files cannot be determined", async (t) => {
  const cwd = temporaryDirectory();

  t.is(await getCommitsFiles(undefined, "HEAD", { cwd }), undefined);
});

test("Attribute a moved file to its destination even without rename detection", async (t) => {
  const { cwd } = await gitRepo();
  await gitCommitFiles({ "packages/ui/a.js": "ui", "packages/other/b.js": "other" }, "chore: init", { cwd });
  // A repository can disable rename detection, which would otherwise attribute the move to both packages
  await gitAddConfig("diff.renames", "false", { cwd });
  await execa("git", ["mv", "packages/ui/a.js", "packages/other/a.js"], { cwd });
  await execa("git", ["commit", "-m", "refactor: move out of ui", "--no-gpg-sign"], { cwd });

  const filesByHash = await getCommitsFiles(undefined, "HEAD", { cwd });
  const moved = (await execa("git", ["rev-parse", "HEAD"], { cwd })).stdout;

  t.deepEqual(filesByHash.get(moved).files, ["packages/other/a.js"]);
});

test("Report only the destination of a move between the local head and the remote tip", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  await gitCommitFiles({ "packages/ui/a.js": "ui", "packages/other/b.js": "other" }, "chore: init", { cwd });
  await gitPush(repositoryUrl, "master", { cwd });

  const otherClone = await gitShallowClone(repositoryUrl);
  await execa("git", ["mv", "packages/ui/a.js", "packages/other/a.js"], { cwd: otherClone });
  await execa("git", ["commit", "-m", "refactor: move out of ui", "--no-gpg-sign"], { cwd: otherClone });
  await gitPush("origin", "master", { cwd: otherClone });

  // The repository doing the comparison is the one whose configuration matters
  await gitAddConfig("diff.renames", "false", { cwd });

  t.deepEqual(await getChangedFilesSinceRemote(repositoryUrl, "master", { cwd }), ["packages/other/a.js"]);
});

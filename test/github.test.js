import test from "ava";
import { getPullRequestNumber, getInnerSquashedCommits } from "../lib/github.js";
import { gitTagHead } from "./helpers/git-utils.js";
import { isNull } from "lodash-es";
import { cloneRemoteSquashMergeRepo } from "./helpers/github-utils.js";
import { getBranches, getGitHead, isGitRepo, isRefExists } from "../lib/git.js";

test("Return true for valid pull number", (t) => {
  let commit1 = { message: "Some solved issue (#2)" };
  let commit2 = { message: "Some solved issue (#15)" };
  let commit3 = { message: "Some solved issue (#169)" };
  t.true(2 == getPullRequestNumber(commit1));
  t.true(15 == getPullRequestNumber(commit2));
  t.true(169 == getPullRequestNumber(commit3));
});

test("Return true for invalid pull number returning null", (t) => {
  let commit1 = { message: "Some solved issue (##2)" };
  let commit2 = { message: "Some solved issue ( #15 )" };
  let commit3 = { message: "Some solved issue (#169 )" };
  let commit4 = { message: "Some solved issue (#2)." };
  t.true(isNull(getPullRequestNumber(commit1)));
  t.true(isNull(getPullRequestNumber(commit2)));
  t.true(isNull(getPullRequestNumber(commit3)));
  t.true(isNull(getPullRequestNumber(commit4)));
});

test("Get all commits inside a squashed and merged commit", async (t) => {
  // Clone an existing github repository
  const repoUrl = "https://github.com/GuiBL4/semantic-release-squash-and-merge-testbed.git";
  let cwd = await cloneRemoteSquashMergeRepo(repoUrl);

  let from = await gitTagHead("v1.0.0", { cwd });
  let to = await getGitHead({ cwd });

  // Retrieve the commits with the commits module, since commit 'First'
  const commits = await getInnerSquashedCommits(from, to, {
    cwd,
    logger: t.context.logger,
    options: { repositoryUrl: repoUrl },
  });
  t.is(commits.length, 3);
  t.is(commits[0].message, "patch:some patch");
  t.is(commits[1].message, "feat(script): add a script");
  t.is(commits[2].message, "feat: add a feature");
  t.true(await isRefExists("main", { cwd }));
  t.deepEqual(await getBranches(cwd), ["main"]);
  t.true(await isGitRepo({ cwd }));
});

import { Octokit } from "octokit";
import debugGitHub from "debug";
import GitUrlParse from "git-url-parse";
import { getCommits } from "./git.js";
import { isNull } from "lodash-es";

const debug = debugGitHub("semantic-release:github");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

/**
 * Return the list of commits contained in a given GitHub pull request.
 *
 * Given a pull request (PR) number, this function returns the list of conventional commits contained
 * in it.
 * The PR number can be extracted by parsing the content of the squash and merge commit message,
 * where in the subject, the number of the PR is mentioned, as shown below, where the PR number is 33:
 *
 *  'Modify main documentation (#33)'
 *
 * When squashing and merging a PR, the history of commits is lost, but the latter can be recovered
 * from the repository's hosting service (using the GitHub API, for instance), using the PR number.
 *
 * @param {String} from to includes all commits made after this sha (does not include this sha).
 * @param {String} to to includes all commits made before this sha (also include this sha).
 * @param {Object} [execaOpts] Options to pass to `execa`.
 * @return {Promise<Array<Object>>} The list of commits between `from` and `to`.
 */

export async function getInnerSquashedCommits(from, to, execaOpts) {
  const { name, owner } = GitUrlParse(execaOpts.options.repositoryUrl);
  let commits = [];
  let commitsPr = await getCommits(from, to, { cwd: execaOpts.cwd, env: execaOpts.env });

  for (const commit of commitsPr) {
    let prNumber = getPullRequestNumber(commit);
    debug(`The PR's number is ${prNumber} from the message : ${commit.message}`);

    if (isNull(prNumber)) {
      console.error(`No pull request's number found in the message : ${commit.message}.`);
      continue;
    }

    // The inner commits could be found from a PR using the GitHub's API avaiblable here :
    // https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-commits-on-a-pull-request
    const inner_commits = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}/commits", {
      owner: owner,
      repo: name,
      pull_number: prNumber,
      headers: { "X-GitHub-Api-Version": "2022-11-28" },
    });

    // The inner commits found with the octokit request are in an array called "data"
    for (let i = 0; i < inner_commits.data.length; i++) {
      commits.push({ hash: inner_commits.data[i].sha, ...inner_commits.data[i].commit });
    }
  }
  debug(commits);

  return commits;
}

/**
 * Parse the title of a squash and merge commit, and return the pull request number it refers to.
 *
 * A squash and merge commit combines several commits from a pull request's branch to the main branch, so
 * that to keep the git history lean and clean.
 * The expected format of a conventional squash and merge message is as follow:
 *
 *   'Modify the data model (#34)'
 *
 * Here '34' is the number of the pull request the input squash and commit message refers
 * to and that we want to extract.
 *
 * @param {String} commit The merged commit in which the message contains the pull request number to be extracted.
 * @return {String} A string containing the pull request number this squash commit refers to. Returns 'null' if not found.
 */

export function getPullRequestNumber(commit) {
  const regex = /\(\#(?<number>[0-9]+)\)$/;
  let found = commit.message.match(regex);

  return found != null ? found.groups.number : null;
}

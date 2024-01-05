import { format, parse } from "node:url";
import { isNil } from "lodash-es";
import hostedGitInfo from "hosted-git-info";
import debugAuthUrl from "debug";
import { verifyAuth } from "./git.js";

const debug = debugAuthUrl("semantic-release:get-git-auth-url");

/**
 * Machinery to format a repository URL with the given credentials
 *
 * @param {String} protocol URL protocol (which should not be present in repositoryUrl)
 * @param {String} repositoryUrl User-given repository URL
 * @param {String} gitCredentials The basic auth part of the URL
 *
 * @return {String} The formatted Git repository URL.
 */
function formatAuthUrl(protocol, repositoryUrl, gitCredentials) {
  const [match, auth, host, basePort, path] =
    /^(?!.+:\/\/)(?:(?<auth>.*)@)?(?<host>.*?):(?<port>\d+)?:?\/?(?<path>.*)$/.exec(repositoryUrl) || [];
  const { port, hostname, ...parsed } = parse(
    match ? `ssh://${auth ? `${auth}@` : ""}${host}${basePort ? `:${basePort}` : ""}/${path}` : repositoryUrl
  );

  return format({
    ...parsed,
    auth: gitCredentials,
    host: `${hostname}${protocol === "ssh:" ? "" : port ? `:${port}` : ""}`,
    protocol: protocol && /http[^s]/.test(protocol) ? "http" : "https",
  });
}

/**
 * Verify authUrl by calling git.verifyAuth, but don't throw on failure
 *
 * @param {Object} context semantic-release context.
 * @param {String} authUrl Repository URL to verify
 *
 * @return {String} The authUrl as is if the connection was successful, null otherwise
 */
async function ensureValidAuthUrl({ cwd, env, branch }, authUrl) {
  try {
    await verifyAuth(authUrl, branch.name, { cwd, env });
    return authUrl;
  } catch (error) {
    debug(error);
    return null;
  }
}

/**
 * Determine the the git repository URL to use to push, either:
 * - The `repositoryUrl` as is if allowed to push
 * - The `repositoryUrl` converted to `https` or `http` with Basic Authentication
 *
 * In addition, expand shortcut URLs (`owner/repo` => `https://github.com/owner/repo.git`) and transform `git+https` / `git+http` URLs to `https` / `http`.
 *
 * @param {Object} context semantic-release context.
 *
 * @return {String} The formatted Git repository URL.
 */
export default async (context) => {
  const { cwd, env, branch } = context;
  const GIT_TOKENS = {
    GIT_CREDENTIALS: undefined,
    GH_TOKEN: undefined,
    // GitHub Actions require the "x-access-token:" prefix for git access
    // https://developer.github.com/apps/building-github-apps/authenticating-with-github-apps/#http-based-git-access-by-an-installation
    GITHUB_TOKEN: isNil(env.GITHUB_ACTION) ? undefined : "x-access-token:",
    GL_TOKEN: "gitlab-ci-token:",
    GITLAB_TOKEN: "gitlab-ci-token:",
    BB_TOKEN: "x-token-auth:",
    BITBUCKET_TOKEN: "x-token-auth:",
    BB_TOKEN_BASIC_AUTH: "",
    BITBUCKET_TOKEN_BASIC_AUTH: "",
  };

  let { repositoryUrl } = context.options;
  const info = hostedGitInfo.fromUrl(repositoryUrl, { noGitPlus: true });
  const { protocol, ...parsed } = parse(repositoryUrl);

  if (info && info.getDefaultRepresentation() === "shortcut") {
    // Expand shorthand URLs (such as `owner/repo` or `gitlab:owner/repo`)
    repositoryUrl = info.https();
  } else if (protocol && protocol.includes("http")) {
    // Replace `git+https` and `git+http` with `https` or `http`
    repositoryUrl = format({ ...parsed, protocol: protocol.includes("https") ? "https" : "http", href: null });
  }

  // Test if push is allowed without transforming the URL (e.g. is ssh keys are set up)
  try {
    debug("Verifying ssh auth by attempting to push to  %s", repositoryUrl);
    await verifyAuth(repositoryUrl, branch.name, { cwd, env });
  } catch {
    debug("SSH key auth failed, falling back to https.");
    const envVars = Object.keys(GIT_TOKENS).filter((envVar) => !isNil(env[envVar]));

    // Skip verification if there is no ambiguity on which env var to use for authentication
    if (envVars.length === 1) {
      const gitCredentials = `${GIT_TOKENS[envVars[0]] || ""}${env[envVars[0]]}`;
      return formatAuthUrl(protocol, repositoryUrl, gitCredentials);
    }

    if (envVars.length > 1) {
      debug(`Found ${envVars.length} credentials in environment, trying all of them`);

      const candidateRepositoryUrls = [];
      for (const envVar of envVars) {
        const gitCredentials = `${GIT_TOKENS[envVar] || ""}${env[envVar]}`;
        const authUrl = formatAuthUrl(protocol, repositoryUrl, gitCredentials);
        candidateRepositoryUrls.push(ensureValidAuthUrl(context, authUrl));
      }

      const validRepositoryUrls = await Promise.all(candidateRepositoryUrls);
      const chosenAuthUrlIndex = validRepositoryUrls.findIndex((url) => url !== null);
      if (chosenAuthUrlIndex > -1) {
        debug(`Using "${envVars[chosenAuthUrlIndex]}" to authenticate`);
        return validRepositoryUrls[chosenAuthUrlIndex];
      }
    }
  }

  return repositoryUrl;
};

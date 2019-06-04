const {parse, format} = require('url'); // eslint-disable-line node/no-deprecated-api
const {isNil} = require('lodash');
const hostedGitInfo = require('hosted-git-info');
const {verifyAuth} = require('./git');

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
module.exports = async ({cwd, env, options: {repositoryUrl, branch}}) => {
  const GIT_TOKENS = {
    GIT_CREDENTIALS: undefined,
    GH_TOKEN: undefined,
    // GitHub Actions require the "x-access-token:" prefix for git access
    // https://developer.github.com/apps/building-github-apps/authenticating-with-github-apps/#http-based-git-access-by-an-installation
    GITHUB_TOKEN: isNil(env.GITHUB_ACTION) ? undefined : 'x-access-token:',
    GL_TOKEN: 'gitlab-ci-token:',
    GITLAB_TOKEN: 'gitlab-ci-token:',
    BB_TOKEN: 'x-token-auth:',
    BITBUCKET_TOKEN: 'x-token-auth:',
  };

  const info = hostedGitInfo.fromUrl(repositoryUrl, {noGitPlus: true});
  const {protocol, ...parsed} = parse(repositoryUrl);

  if (info && info.getDefaultRepresentation() === 'shortcut') {
    // Expand shorthand URLs (such as `owner/repo` or `gitlab:owner/repo`)
    repositoryUrl = info.https();
  } else if (protocol && protocol.includes('http')) {
    // Replace `git+https` and `git+http` with `https` or `http`
    repositoryUrl = format({...parsed, protocol: protocol.includes('https') ? 'https' : 'http', href: null});
  }

  // Test if push is allowed without transforming the URL (e.g. is ssh keys are set up)
  try {
    await verifyAuth(repositoryUrl, branch, {cwd, env});
  } catch (error) {
    const envVar = Object.keys(GIT_TOKENS).find(envVar => !isNil(env[envVar]));
    const gitCredentials = `${GIT_TOKENS[envVar] || ''}${env[envVar] || ''}`;

    if (gitCredentials) {
      // If credentials are set via environment variables, convert the URL to http/https and add basic auth, otherwise return `repositoryUrl` as is
      const [match, auth, host, path] = /^(?!.+:\/\/)(?:(.*)@)?(.*?):(.*)$/.exec(repositoryUrl) || [];
      return format({
        ...parse(match ? `ssh://${auth ? `${auth}@` : ''}${host}/${path}` : repositoryUrl),
        auth: gitCredentials,
        protocol: protocol && /http[^s]/.test(protocol) ? 'http' : 'https',
      });
    }
  }

  return repositoryUrl;
};

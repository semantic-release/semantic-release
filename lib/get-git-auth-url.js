const {parse, format} = require('url');
const {isUndefined} = require('lodash');
const gitUrlParse = require('git-url-parse');

const GIT_TOKENS = ['GIT_CREDENTIALS', 'GH_TOKEN', 'GITHUB_TOKEN', 'GL_TOKEN', 'GITLAB_TOKEN'];

/**
 * Generate the git repository URL with creadentials.
 * If the `gitCredentials` is defined, returns a http or https URL with Basic Authentication (`https://username:passowrd@hostname:port/path.git`).
 * If the `gitCredentials` is undefined, returns the `repositoryUrl`. In that case it's expected for the user to have setup the Git authentication on the CI (for example via SSH keys).
 *
 * @param {String} gitCredentials Basic HTTP Authentication credentials, can be `username:password` or a token for certain Git providers.
 * @param {String}  repositoryUrl The git repository URL.
 * @return {String} The formatted Git repository URL.
 */
module.exports = repositoryUrl => {
  const envVar = GIT_TOKENS.find(envVar => !isUndefined(process.env[envVar]));
  const gitCredentials = ['GL_TOKEN', 'GITLAB_TOKEN'].includes(envVar)
    ? `gitlab-ci-token:${process.env[envVar]}`
    : process.env[envVar];

  const {protocols} = gitUrlParse(repositoryUrl);
  const protocol = protocols.includes('https') ? 'https' : protocols.includes('http') ? 'http' : 'https';

  if (!gitCredentials) {
    return protocols.includes('https') ? `${gitUrlParse(repositoryUrl).toString(protocol)}.git` : repositoryUrl;
  }

  return format({...parse(`${gitUrlParse(repositoryUrl).toString(protocol)}.git`), ...{auth: gitCredentials}});
};

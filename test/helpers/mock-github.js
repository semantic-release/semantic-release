import nock from 'nock';

/**
 * Retun a `nock` object setup to respond to a github authentication request. Other expectation and responses can be chained.
 *
 * @param {String} [githubToken='GH_TOKEN'] The github token to return in the authentication response.
 * @param {String} [githubUrl='https://api.github.com'] The url on which to intercept http requests.
 * @return {Object} A `nock` object ready to respond to a github authentication request.
 */
export function authenticate(
  {githubToken = 'GH_TOKEN', githubUrl = 'https://api.github.com', githubApiPathPrefix = ''} = {}
) {
  return nock(`${githubUrl}/${githubApiPathPrefix}`, {reqheaders: {Authorization: `token ${githubToken}`}});
}

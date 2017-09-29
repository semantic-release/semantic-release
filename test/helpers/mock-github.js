import nock from 'nock';

export function authenticate(
  {githubToken = 'GH_TOKEN', githubUrl = 'https://api.github.com', githubApiPathPrefix = ''} = {}
) {
  return nock(`${githubUrl}/${githubApiPathPrefix}`, {reqheaders: {Authorization: `token ${githubToken}`}});
}

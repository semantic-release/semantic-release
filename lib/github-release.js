const {promisify} = require('util');
const url = require('url');
const gitHead = require('git-head');
const GitHubApi = require('github');
const parseSlug = require('parse-github-repo-url');
const debug = require('debug')('semantic-release:github-release');

module.exports = async (pkg, notes, version, {branch, githubUrl, githubToken, githubApiPathPrefix}) => {
  const [owner, repo] = parseSlug(pkg.repository.url);
  let {port, protocol, hostname: host} = githubUrl ? url.parse(githubUrl) : {};
  protocol = (protocol || '').split(':')[0] || null;
  const pathPrefix = githubApiPathPrefix || null;
  const github = new GitHubApi({port, protocol, host, pathPrefix});
  debug('Github host: %o', host);
  debug('Github port: %o', port);
  debug('Github protocol: %o', protocol);
  debug('Github pathPrefix: %o', pathPrefix);

  github.authenticate({type: 'token', token: githubToken});

  const name = `v${version}`;
  const release = {owner, repo, tag_name: name, name, target_commitish: branch, body: notes};
  debug('release owner: %o', owner);
  debug('release repo: %o', repo);
  debug('release name: %o', name);
  debug('release branch: %o', branch);

  const sha = await promisify(gitHead)();
  const ref = `refs/tags/${name}`;

  debug('Create git tag %o with commit %o', ref, sha);
  await github.gitdata.createReference({owner, repo, ref, sha});
  const {data: {html_url: releaseUrl}} = await github.repos.createRelease(release);

  return releaseUrl;
};

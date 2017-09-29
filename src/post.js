const {promisify} = require('util');
const url = require('url');
const gitHead = require('git-head');
const GitHubApi = require('github');
const parseSlug = require('parse-github-repo-url');

module.exports = async config => {
  const {pkg, options: {branch, debug, githubUrl, githubToken, githubApiPathPrefix}, plugins} = config;
  const [owner, repo] = parseSlug(pkg.repository.url);
  const name = `v${pkg.version}`;
  const tag = {owner, repo, ref: `refs/tags/${name}`, sha: await promisify(gitHead)()};
  const body = await promisify(plugins.generateNotes)(config);
  const release = {owner, repo, tag_name: name, name, target_commitish: branch, draft: !!debug, body};

  if (debug && !githubToken) {
    return {published: false, release};
  }

  const {port, protocol, hostname} = githubUrl ? url.parse(githubUrl) : {};
  const github = new GitHubApi({
    port,
    protocol: (protocol || '').split(':')[0] || null,
    host: hostname,
    pathPrefix: githubApiPathPrefix || null,
  });

  github.authenticate({type: 'token', token: githubToken});

  if (debug) {
    await github.repos.createRelease(release);
    return {published: true, release};
  }

  await github.gitdata.createReference(tag);
  await github.repos.createRelease(release);

  return {published: true, release};
};

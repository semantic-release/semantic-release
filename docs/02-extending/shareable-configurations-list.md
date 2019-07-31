# Shareable configurations list

## Official configurations
- [@semantic-release/apm-config](https://github.com/semantic-release/apm-config) - semantic-release shareable configuration for releasing atom packages
- [@semantic-release/gitlab-config](https://github.com/semantic-release/gitlab-config) - semantic-release shareable configuration for GitLab

## Community configurations
- [@jedmao/semantic-release-npm-github-config](https://github.com/jedmao/semantic-release-npm-github-config)
  - Provides an informative [git](https://github.com/semantic-release/git) commit message for the release commit that does not trigger continuous integration and conforms to the [conventional commits specification](https://www.conventionalcommits.org/) (e.g., "chore(release): 1.2.3 [skip ci]\n\nnotes").
  - Creates a tarball that gets uploaded with each [GitHub release](https://github.com/semantic-release/github).
  - Publishes the same tarball to [npm](https://github.com/semantic-release/npm).
  - Commits the version change in `package.json`.
  - Creates or updates a [changelog](https://github.com/semantic-release/changelog) file.

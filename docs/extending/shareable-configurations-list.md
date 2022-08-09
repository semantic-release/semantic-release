# Shareable configurations list

## Official configurations
- [@semantic-release/apm-config](https://github.com/semantic-release/apm-config) - semantic-release shareable configuration for releasing atom packages
- [@semantic-release/gitlab-config](https://github.com/semantic-release/gitlab-config) - semantic-release shareable configuration for GitLab

## Community configurations
- [@jedmao/semantic-release-npm-github-config](https://github.com/jedmao/semantic-release-npm-github-config)
  - Provides an informative [Git](https://github.com/semantic-release/git) commit message for the release commit that does not trigger continuous integration and conforms to the [conventional commits specification](https://www.conventionalcommits.org/) (e.g., `chore(release): 1.2.3 [skip ci]\n\nnotes`).
  - Creates a tarball that gets uploaded with each [GitHub release](https://github.com/semantic-release/github).
  - Publishes the same tarball to [npm](https://github.com/semantic-release/npm).
  - Commits the version change in `package.json`.
  - Creates or updates a [changelog](https://github.com/semantic-release/changelog) file.
- [semantic-release-npm-github-publish](https://github.com/oleg-koval/semantic-release-npm-github-publish)
  - Based on [angular preset](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular).
  - Adds more keywords for the `chore` **PATCH** release.
  - Generates or updates a [changelog](https://github.com/semantic-release/changelog) file including all **PATCH** keywords (not included in default angular package).
  - Updates GitHub release with release-notes.
  - Bumps a version in package.json.
  - Publishes the new version to [NPM](https://npmjs.org).

<h1 align="center" style="border-bottom: none;">📦🚀 semantic-release</h1>
<h3 align="center">Fully automated version management and package publishing</h3>
<p align="center">
  <a href="https://spectrum.chat/semantic-release">
    <img alt="Join the community on Spectrum" src="https://withspectrum.github.io/badge/badge.svg">
  </a>
  <a href="https://travis-ci.org/semantic-release/semantic-release">
    <img alt="Travis" src="https://img.shields.io/travis/semantic-release/semantic-release/master.svg">
  </a>
  <a href="https://codecov.io/gh/semantic-release/semantic-release">
    <img alt="Codecov" src="https://img.shields.io/codecov/c/github/semantic-release/semantic-release/master.svg">
  </a>
  <a href="https://greenkeeper.io">
    <img alt="Greenkeeper" src="https://badges.greenkeeper.io/semantic-release/semantic-release.svg">
  </a>
  <a href="#badge">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
  </a>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/semantic-release">
    <img alt="npm latest version" src="https://img.shields.io/npm/v/semantic-release/latest.svg">
  </a>
  <a href="https://www.npmjs.com/package/semantic-release">
    <img alt="npm next version" src="https://img.shields.io/npm/v/semantic-release/next.svg">
  </a>
  <a href="https://www.npmjs.com/package/semantic-release">
    <img alt="npm beta version" src="https://img.shields.io/npm/v/semantic-release/beta.svg">
  </a>
</p>

**semantic-release** automates the whole package release workflow including: determining the next version number, generating the release notes and publishing the package.

This removes the immediate connection between human emotions and version numbers, strictly following the [Semantic Versioning](http://semver.org) specification.

> Trust us, this will change your workflow for the better. – [egghead.io](https://egghead.io/lessons/javascript-how-to-write-a-javascript-library-automating-releases-with-semantic-release)

## Highlights

- Fully automated release
- Enforce [Semantic Versioning](https://semver.org) specification
- New features and fixes are immediately available to users
- Notify maintainers and users of new releases
- Use formalized commit message convention to document changes in the codebase
- Publish on different distribution channels (such as [npm dist-tags](https://docs.npmjs.com/cli/dist-tag)) based on git merges
- Integrate with your [continuous integration workflow](docs/recipes/README.md#ci-configurations)
- Avoid potential errors associated with manual releases
- Support any [package managers and languages](docs/recipes/README.md#package-managers-and-languages) via [plugins](docs/usage/plugins.md)
- Simple and reusable configuration via [shareable configurations](docs/usage/shareable-configurations.md)

## How does it work?

### Commit message format

**semantic-release** uses the commit messages to determine the type of changes in the codebase. Following formalized conventions for commit messages, **semantic-release** automatically determines the next [semantic version](https://semver.org) number, generates a changelog and publishes the release.

By default **semantic-release** uses [Angular Commit Message Conventions](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines). The commit message format can be changed with the [`preset` or `config` options](docs/usage/configuration.md#options) of the [@semantic-release/commit-analyzer](https://github.com/semantic-release/commit-analyzer#options) and [@semantic-release/release-notes-generator](https://github.com/semantic-release/release-notes-generator#options) plugins.

Tools such as [commitizen](https://github.com/commitizen/cz-cli) or [commitlint](https://github.com/conventional-changelog/commitlint) can be used to help contributors and enforce valid commit messages.

Here is an example of the release type that will be done based on a commit messages:

| Commit message                                                                                                                                                                                   | Release type               |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------|
| `fix(pencil): stop graphite breaking when too much pressure applied`                                                                                                                             | Patch Release              |
| `feat(pencil): add 'graphiteWidth' option`                                                                                                                                                       | ~~Minor~~ Feature Release  |
| `perf(pencil): remove graphiteWidth option`<br><br>`BREAKING CHANGE: The graphiteWidth option has been removed.`<br>`The default graphite width of 10mm is always used for performance reasons.` | ~~Major~~ Breaking Release |

### Automation with CI

**semantic-release** is meant to be executed on the CI environment after every successful build on the release branch. This way no human is directly involved in the release process and the releases are guaranteed to be [unromantic and unsentimental](http://sentimentalversioning.org).

### Triggering a release

For each new commits added to one of the release branches (for example `master`, `next`, `beta`), with `git push` or by merging a pull request or merging from another branch, a CI build is triggered and runs the `semantic-release` command to make a release if there are codebase changes since the last release that affect the package functionalities.

**semantic-release** offers various ways to control the timing, the content and the audience of published releases. See example workflows in the following recipes:
- [Using distribution channels](docs/recipes/distribution-channels.md#publishing-on-distribution-channels)
- [Maintenance releases](docs/recipes/maintenance-releases.md#publishing-maintenance-releases)
- [Pre-releases](docs/recipes/pre-releases.md#publishing-pre-releases)

### Release steps

After running the tests, the command `semantic-release` will execute the following steps:

| Step              | Description                                                                                                                     |
|-------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Verify Conditions | Verify all the conditions to proceed with the release.                                                                          |
| Get last release  | Obtain the commit corresponding to the last release by analyzing [Git tags](https://git-scm.com/book/en/v2/Git-Basics-Tagging). |
| Analyze commits   | Determine the type of release based on the commits added since the last release.                                                |
| Verify release    | Verify the release conformity.                                                                                                  |
| Generate notes    | Generate release notes for the commits added since the last release.                                                            |
| Create Git tag    | Create a Git tag corresponding to the new release version.                                                                      |
| Prepare           | Prepare the release.                                                                                                            |
| Publish           | Publish the release.                                                                                                            |
| Notify            | Notify of new releases or errors.                                                                                               |

## Requirements

In order to use **semantic-release** you need:
- To host your code in a [Git repository](https://git-scm.com)
- Use a Continuous Integration service that allows you to [securely set up credentials](docs/usage/ci-configuration.md#authentication)
- Git CLI version [2.7.1 or higher](docs/support/FAQ.md#why-does-semantic-release-require-git-version--271) installed in your Continuous Integration environment
- [Node.js](https://nodejs.org) version [10.18 or higher](docs/support/FAQ.md#why-does-semantic-release-require-node-version--1018) installed in your Continuous Integration environment

## Documentation

- Usage
  - [Getting started](docs/usage/getting-started.md#getting-started)
  - [Installation](docs/usage/installation.md#installation)
  - [CI Configuration](docs/usage/ci-configuration.md#ci-configuration)
  - [Configuration](docs/usage/configuration.md#configuration)
  - [Plugins](docs/usage/plugins.md)
  - [Workflow configuration](docs/usage/workflow-configuration.md)
  - [Shareable configurations](docs/usage/shareable-configurations.md)
- Extending
  - [Plugins](docs/extending/plugins-list.md)
  - [Shareable configuration](docs/extending/shareable-configurations-list.md)
- Recipes
  - [CI configurations](docs/recipes/README.md)
  - [Git hosted services](docs/recipes/README.md)
  - [Release workflow](docs/recipes/README.md)
  - [Package managers and languages](docs/recipes/README.md)
- Developer guide
  - [JavaScript API](docs/developer-guide/js-api.md)
  - [Plugins development](docs/developer-guide/plugin.md)
  - [Shareable configuration development](docs/developer-guide/shareable-configuration.md)
- Support
  - [Resources](docs/support/resources.md)
  - [Frequently Asked Questions](docs/support/FAQ.md)
  - [Troubleshooting](docs/support/troubleshooting.md)
  - [Node version requirement](docs/support/node-version.md)
  - [Node Support Policy](docs/support/node-support-policy.md)

## Get help

- [Stack Overflow](https://stackoverflow.com/questions/tagged/semantic-release)
- [Spectrum community](https://spectrum.chat/semantic-release)
- [Twitter](https://twitter.com/SemanticRelease)

## Badge

Let people know that your package is published using **semantic-release** by including this badge in your readme.

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

```md
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
```

## Team

| [![Stephan Bönnemann](https://github.com/boennemann.png?size=100)](https://github.com/boennemann) | [![Rolf Erik Lekang](https://github.com/relekang.png?size=100)](https://github.com/relekang) | [![Johannes Jörg Schmidt](https://github.com/jo.png?size=100)](https://github.com/jo) | [![Gregor Martynus](https://github.com/gr2m.png?size=100)](https://github.com/gr2m) | [![Pierre Vanduynslager](https://github.com/finnp.png?size=100)](https://github.com/finnp) | [![Pierre Vanduynslager](https://github.com/pvdlg.png?size=100)](https://github.com/pvdlg) | [![Christoph Witzko](https://github.com/christophwitzko.png?size=100)](https://github.com/christophwitzko) |
|---------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| [Stephan Bönnemann](https://github.com/boennemann)                                                | [Rolf Erik Lekang](https://github.com/relekang)                                              | [Johannes Jörg Schmidt](https://github.com/jo)                                        | [Gregor Martynus](https://github.com/gr2m)                                          | [Finn Pauls](https://github.com/finnp)                                                     | [Pierre Vanduynslager](https://github.com/pvdlg)                                           | [Christoph Witzko](https://github.com/christophwitzko)                                                     |

<p align="center">
  <img alt="Kill all humans" src="media/bender.png">
</p>

<h1 align="center" style="border-bottom: none;">📦🚀 semantic-release</h1>
<h3 align="center">Fully automated version management and package publishing</h3>
<p align="center">
  <a href="https://gitter.im/semantic-release/semantic-release">
    <img alt="Gitter" src="https://badges.gitter.im/semantic-release/semantic-release.svg">
  </a>
  <a href="https://travis-ci.org/semantic-release/semantic-release">
    <img alt="Travis" src="https://img.shields.io/travis/semantic-release/semantic-release/caribou.svg">
  </a>
  <a href="https://codecov.io/gh/semantic-release/semantic-release">
    <img alt="Codecov" src="https://img.shields.io/codecov/c/github/semantic-release/semantic-release/caribou.svg">
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
</p>

**semantic-release** automates the whole package release workflow including: determining the next version number, generating the release notes and publishing the package.

This removes the immediate connection between human emotions and version numbers, strictly following the [Semantic Versioning](http://semver.org) specification.

> Trust us, this will change your workflow for the better. – [egghead.io](https://egghead.io/lessons/javascript-how-to-write-a-javascript-library-automating-releases-with-semantic-release)

## Highlights

- Fully automated release
- Enforce [Semantic Versioning](https://semver.org) specification
- New features and fixes are immediately available to users
- Use formalized commit message convention to document changes in the codebase
- Integrate with your [continuous integration workflow](docs/recipes/README.md#ci-configurations)
- Avoid potential errors associated with manual releases
- Support any  [package managers and languages](docs/recipes/README.md#package-managers-and-languages) via [plugins](docs/usage/plugins.md)
- Simple and reusable configuration via [shareable configurations](docs/usage/shareable-configurations.md)

## How does it work?

### Commit message format

**semantic-release** uses the commit messages to determine the type of changes in the codebase. Following formalized conventions for commit messages, **semantic-release** automatically determines the next [semantic version](https://semver.org) number, generates a changelog and publish the release.

By default **semantic-release** uses [Angular Commit Message Conventions](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines). The commit message format can be changed with the [`preset` or `config` options](docs/usage/configuration.md#options) of the [@semantic-release/commit-analyzer](https://github.com/semantic-release/commit-analyzer#options) and [@semantic-release/release-notes-generator](https://github.com/semantic-release/release-notes-generator#options) plugins.

Tools such as [commitizen](https://github.com/commitizen/cz-cli), [commitlint](https://github.com/marionebl/commitlint) or [semantic-git-commit-cli](https://github.com/JPeer264/node-semantic-git-commit-cli) can be used to help contributor and enforce valid commits message.

Here is an example of the release type that will be done based on a commit messages:

| Commit message                                                                                                                                                                                   | Release type               |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------|
| `fix(pencil): stop graphite breaking when too much pressure applied`                                                                                                                             | Patch Release              |
| `feat(pencil): add 'graphiteWidth' option`                                                                                                                                                       | ~~Minor~~ Feature Release  |
| `perf(pencil): remove graphiteWidth option`<br><br>`BREAKING CHANGE: The graphiteWidth option has been removed.`<br>`The default graphite width of 10mm is always used for performance reasons.` | ~~Major~~ Breaking Release |

### Automation with CI

**semantic-release** is meant to be executed on the CI environment after every successful build on the release branch. This way no human is directly involved in the release process and the releases are guaranteed to be [unromantic and unsentimental](http://sentimentalversioning.org).

### Triggering a release

When pushing new commits to the release branch (i.e. `master`) with `git push` or by merging a pull request or merging from another branch, a CI build is triggered and runs the `semantic-release` command to make a release if there is relevant codebase changes since the last release.

By default a release will be done for each push to the release branch that contains relevant code changes. If you need more control over the timing of releases you have a couple of options:
- Publish releases on a distribution channel (for example npm’s [dist-tags](https://docs.npmjs.com/cli/dist-tag)). This way you can keep control over what your users end up using by default, and you can decide when to make an automatically released version available to the stable channel, and promote it.
- Develop on a `dev` branch and merge it to the release branch (i.e. `master`) once you are ready to publish. **semantic-release** will run only on pushes to the release branch.

### Release steps

After running the tests the command `semantic-release` will execute the following steps:

| Step              | Description                                                                                                                                                           |
|-------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Verify Conditions | Verify all the conditions to proceed with the release with the [verify conditions plugins](docs/usage/plugins.md#verifyconditions-plugin).                            |
| Get last release  | Obtain last release with the [get last release plugin](docs/usage/plugins.md#getlastrelease-plugin).                                                                  |
| Analyze commits   | Determine the type of release to do with the [analyze commits plugin](docs/usage/plugins.md#analyzecommits-plugin) based on the commits added since the last release. |
| Verify release    | Verify the release conformity with the [verify release plugins](docs/usage/plugins.md#verifyrelease-plugin).                                                          |
| Generate notes    | Generate release notes with the [generate notes plugin](docs/usage/plugins.md#generatenotes-plugin) for the commits added since the last release.                     |
| Publish           | Publish the release with the [publish plugins](docs/usage/plugins.md#publish-plugin).                                                                                 |

## Documentation

- Usage
  - [Installation](docs/usage/installation.md#installation)
  - [CI Configuration](docs/usage/ci-configuration.md#ci-configuration)
  - [Configuration](docs/usage/configuration.md#configuration)
  - [Plugins](docs/usage/plugins.md)
  - [Shareable configurations](docs/usage/shareable-configurations.md)
- Extending
  - [Plugins](docs/extending/plugins-list.md)
  - [Shareable configuration](docs/extending/shareable-configurations-list.md)
- Recipes
  - [CI configurations](docs/recipes/README.md)
  - [Package managers and languages](docs/recipes/README.md)
- Developer guide
  - [Plugins](docs/developer-guide/plugin.md)
  - [Shareable configuration](docs/developer-guide/shareable-configuration.md)
- Resources
  - [Videos](docs/resources.md#videos)
  - [Articles](docs/resources.md#articles)
  - [Tutorials](docs/resources.md#tutorials)
- Support
  - [Frequently Asked Questions](docs/support/FAQ.md)
  - [Troubleshooting](docs/support/troubleshooting.md)
  - [Node version requirement](docs/support/node-version.md)
  - [Node Support Policy](docs/support/node-support-policy.md)

## Get help

- [Stack Overflow](https://stackoverflow.com/questions/tagged/semantic-release)
- [Gitter chat](https://gitter.im/semantic-release/semantic-release)
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

# :package::rocket: semantic-release

Fully automated version management and package publishing.

[![Gitter](https://badges.gitter.im/semantic-release/semantic-release.svg)](https://gitter.im/semantic-release/semantic-release?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Travis](https://img.shields.io/travis/semantic-release/semantic-release/caribou.svg)](https://travis-ci.org/semantic-release/semantic-release)
[![Codecov](https://img.shields.io/codecov/c/github/semantic-release/semantic-release/caribou.svg)](https://codecov.io/gh/semantic-release/semantic-release)
[![Greenkeeper badge](https://badges.greenkeeper.io/semantic-release/semantic-release.svg)](https://greenkeeper.io/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

[![npm](https://img.shields.io/npm/v/semantic-release/latest.svg)](https://www.npmjs.com/package/semantic-release)
[![npm](https://img.shields.io/npm/v/semantic-release/next.svg)](https://www.npmjs.com/package/semantic-release)

semantic-release automates the whole package release workflow including: determining the next version number, generating the release notes and publishing the package. This removes the immediate connection between human emotions and version numbers, strictly following the [Semantic Versioning](http://semver.org) specification.

> Trust us, this will change your workflow for the better. – [egghead.io](https://egghead.io/lessons/javascript-how-to-write-a-javascript-library-automating-releases-with-semantic-release)

## Highlights

- Fully automated release
- Enforce [Semantic Versioning](https://semver.org) specification
- New features and fixes are immediately available to users
- Use formalized commit message convention to document changes in the codebase
- Integrate with your [continuous integration workflow](docs/recipes/README.md#ci-configurations)
- Avoid potential errors associated with manual releases
- Support any  [package managers and languages](docs/recipes/README.md#package-managers-and-languages) via [plugins](#plugins)
- Simple and reusable configuration via [shareable configurations](#shareable-configurations)

## Table of Contents

- [How does it work?](#how-does-it-work)
- [Installation and Usage](#installation-and-usage)
- [Plugins](#plugins)
- [Shareable configurations](#shareable-configurations)
- [Recipes](#recipes)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Resources](#resources)
- [Support](#support)
- [Badge](#badge)
- [Node Support Policy](#node-support-policy)
- [Team](#team)

## How does it work?

### Commit message format

semantic-release uses the commit messages to determine the type of changes in the codebase. Following formalized conventions for commit messages, semantic-release automatically determines the next [semantic version](https://semver.org) number, generates a changelog and publish the release.

By default semantic-release uses [Angular Commit Message Conventions](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines). The commit message format that can changed with the [`preset` or `config` options](#options) of the [@semantic-release/commit-analyzer](https://github.com/semantic-release/commit-analyzer#options) and [@semantic-release/release-notes-generator](https://github.com/semantic-release/release-notes-generator#options) plugins.

Tools such as [commitizen](https://github.com/commitizen/cz-cli), [commitlint](https://github.com/marionebl/commitlint) or [semantic-git-commit-cli](https://github.com/JPeer264/node-semantic-git-commit-cli) can be used to help contributor and enforce valid commits message.

Here is an example of the release type that will be done based on a commit messages:

| Commit message                                                                                                                                                                                   | Release type               |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------|
| `fix(pencil): stop graphite breaking when too much pressure applied`                                                                                                                             | Patch Release              |
| `feat(pencil): add 'graphiteWidth' option`                                                                                                                                                       | ~~Minor~~ Feature Release  |
| `perf(pencil): remove graphiteWidth option`<br><br>`BREAKING CHANGE: The graphiteWidth option has been removed.`<br>`The default graphite width of 10mm is always used for performance reasons.` | ~~Major~~ Breaking Release |

### Automation with CI

semantic-release is meant to be executed on the CI environment after every successful build on the release branch. This way no human is directly involved in the release process and the releases are guaranteed to be [unromantic and unsentimental](http://sentimentalversioning.org).

### Triggering a release

When pushing new commits to the release branch (i.e. `master`) with `git push` or by merging a pull request or merging from another branch, a CI build is triggered and runs the `semantic-release` command to make a release if there is relevant codebase changes since the last release.

By default a release will be done for each push to the release branch that contains relevant code changes. If you need more control over the timing of releases you have a couple of options:
- Publish releases on a distribution channel (for example npm’s [dist-tags](https://docs.npmjs.com/cli/dist-tag)). This way you can keep control over what your users end up using by default, and you can decide when to make an automatically released version available to the stable channel, and promote it.
- Develop on a `dev` branch and merge it to the release branch (i.e. `master`) once you are ready to publish. semantic-release will run only on pushes to the release branch.

### Release steps

After running the tests the command `semantic-release` will execute the following steps:

| Step              | Description                                                                                                                                      |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| Verify Conditions | Verify all the conditions to proceed with the release with the [verify conditions plugins](#verifyconditions-plugin).                            |
| Get last release  | Obtain last release with the [get last release plugin](#getlastrelease-plugin).                                                                  |
| Analyze commits   | Determine the type of release to do with the [analyze commits plugin](#analyzecommits-plugin) based on the commits added since the last release. |
| Verify release    | Verify the release conformity with the [verify release plugins](#verifyrelease-plugin).                                                          |
| Generate notes    | Generate release notes with the [generate notes plugin](#generatenotes-plugin) for the commits added since the last release.                     |
| Publish           | Publish the release with the [publish plugins](#publish-plugin).                                                                                 |

## Installation and Usage

### Local installation

For [Node modules projects](https://docs.npmjs.com/getting-started/creating-node-modules) we recommend to install semantic-release locally and to run the `semantic-release` command with a [npm script](https://docs.npmjs.com/misc/scripts):

```bash
$ npm install --save-dev semantic-release
```

In your `package.json`:

```json
"scripts": {
  "semantic-release": "semantic-release"
}
```

Then in the CI environment:

```bash
$ npm run semantic-release
```

### Global installation

For other type of projects we recommend to install semantic-release globally directly in the CI environment:

```bash
$ npm install -g semantic-release
$ semantic-release
```

### CI configuration

#### Run `semantic-release` only after all tests succeeded

The `semantic-release` command must be executed only after all the tests in the CI build pass. If the build runs multiple jobs (for example to test on multiple Operating Systems or Node versions) the CI has to be configured to guarantee that the `semantic-release` command is executed only after all jobs are successful. This can be achieved with [Travis Build Stages](https://docs.travis-ci.com/user/build-stages), [CircleCI Workflows](https://circleci.com/docs/2.0/workflows), [Codeship Deployment Pipelines](https://documentation.codeship.com/basic/builds-and-configuration/deployment-pipelines), [GitLab Pipelines](https://docs.gitlab.com/ee/ci/pipelines.html#introduction-to-pipelines-and-jobs), [Wercker Workflows](http://devcenter.wercker.com/docs/workflows), [GoCD Pipelines](https://docs.gocd.org/current/introduction/concepts_in_go.html#pipeline) or specific tools like [`travis-deploy-once`](https://github.com/semantic-release/travis-deploy-once).

See [CI configuration recipes](docs/recipes/README.md#ci-configurations) for more details.

#### Authentication

Most semantic-release [plugins](#plugins) require to set up authentication in order to publish to your package manager's registry or to access your project's Git hosted service. The authentication token/credentials have to be made available in the CI serice via environment variables.

See each plugin documentation for the environment variable to set up.

The default [npm](https://github.com/semantic-release/npm#environment-variables) and [github](https://github.com/semantic-release/github#environment-variables) plugins require the following environment variables:

| Variable    | Description                                                                                                                                                                                                                                                                                                               |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `NPM_TOKEN` | npm token created via [npm token create](https://docs.npmjs.com/getting-started/working_with_tokens#how-to-create-new-tokens).<br/>**Note**: Only the `auth-only` [level of npm two-factor authentication](https://docs.npmjs.com/getting-started/using-two-factor-authentication#levels-of-authentication) is supported. |
| `GH_TOKEN`  | GitHub authentication token.<br/>**Note**: Only the [personal token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line) authentication is supported.                                                                                                                                 |

See [CI configuration recipes](docs/recipes/README.md#ci-configurations) for more details on how to configure environment variables in your CI service.

### Automatic setup with `semantic-release-cli`

[`semantic-release-cli`](https://github.com/semantic-release/cli) allow to easily [install](#installation-and-usage) semantic-release in your Node project and set up the [CI configuration](#ci-configuration):

```bash
npm install -g semantic-release-cli

cd your-module
semantic-release-cli setup
```

![dialogue](media/semantic-release-cli.png)

See the [semantic-release-cli](https://github.com/semantic-release/cli#what-it-does) documentation for more details.

### Configuration

In order to customize semantic-release’s behavior, [options](#options) and [plugins](#plugins) can be set via:
- A `.releaserc` file, written in YAML or JSON, with optional extensions: .`yaml`/`.yml`/`.json`/`.js`
- A `release.config.js` file that exports an object
- A `release` key in the project's `package.json` file
- CLI arguments

The following two examples are the same.

Via CLI argument:

```bash
$ semantic-release --branch next
```

Via `release` key in the project's `package.json` file:

```json
"release": {
  "branch": "next"
}
```
```bash
$ semantic-release
```

**Note**: CLI arguments take precedence over options configured in the configuration file.

**Note**: Plugins options cannot be defined via CLI arguments and must be defined in the configuration file.

### Options

#### extends

Type: `Array`, `String`

CLI arguments: `-e`, `--extends`

List of modules or file paths containing a [shareable configuration](#shareable-configurations). If multiple shareable configuration are set, they will be imported in the order defined with each configuration option taking precedence over the options defined in a previous shareable configuration.

**Note**: Options defined via CLI arguments or in the configuration file will take precedence over the ones defined in any shareable configuration.

#### branch

Type: `String`

Default: `master`

CLI arguments: `-b`, `--branch`

The branch on which releases should happen.

#### repositoryUrl

Type: `String`

Default: `repository` property in `package.json` or [git origin url](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes)

CLI arguments: `-r`, `--repository-url`

The git repository URL

Any valid git url format is supported (See [Git protocols](https://git-scm.com/book/en/v2/Git-on-the-Server-The-Protocols)).

**Note**: If the [Github plugin](https://github.com/semantic-release/github) is used the URL must be a valid Github URL that include the `owner`, the `repository` name and the `host`. **The Github shorthand URL is not supported.**

#### dryRun

Type: `Boolean`

Default: `false` if running in a CI environment, `false` otherwise

CLI arguments: `-d`, `--dry-run`

Dry-run mode, skip publishing, print next version and release notes.

#### noCi

Type: `Boolean`

Default: `false`

CLI arguments: `--no-ci`

Skip Continuous Integration environment verifications, allowing to make releases from a local machine.

#### debug

Type: `Boolean`

Default: `false`

CLI argument: `--debug`

Output debugging information. It can also be enabled by set the `DEBUG` environment variable to `semantic-release`.

#### verifyConditions

Type: `Array`, `String`, `Object`

Default: `['@semantic-release/npm', '@semantic-release/github']`

CLI argument: `--verify-conditions`

Define the list of [verify conditions plugins](#verifyconditions-plugin). Plugins will run in series, in the order defined in the `Array`.

See [Plugins configuration](#plugins-configuration) for more details.

#### getLastRelease

Type: `String`, `Object`

Default: `['@semantic-release/npm']`

CLI argument: `--get-last-release`

Define the [get last release plugin](#getlastrelease-plugin).

See [Plugins configuration](#plugins-configuration) for more details.

#### analyzeCommits

Type: `String`, `Object`

Default: `['@semantic-release/commit-analyzer']`

CLI argument: `--analyze-commits`

Define the [analyze commits plugin](#analyzecommits-plugin).

See [Plugins configuration](#plugins-configuration) for more details.

#### verifyRelease

Type: `Array`, `String`, `Object`

Default: `[]`

CLI argument: `--verify-release`

Define the list of [verify release plugins](#verifyrelease-plugin). Plugins will run in series, in the order defined in the `Array`.

See [Plugins configuration](#plugins-configuration) for more details.

#### generateNotes

Type: `String`, `Object`

Default: `['@semantic-release/release-notes-generator']`

CLI argument: `--generate-notes`

Define the [generate notes plugin](#generatenotes-plugin).

See [Plugins configuration](#plugins-configuration) for more details.

#### publish

Type: `Array`, `String`, `Object`

Default: `['@semantic-release/npm', '@semantic-release/github']`

CLI argument: `--publish`

Define the list of [publish plugins](#publish-plugin). Plugins will run in series, in the order defined in the `Array`.

See [Plugins configuration](#plugins-configuration) for more details.

## Plugins

Each [release steps](#release-steps) is implemented within a plugin or a list of plugins that can be configured, allowing to support different [commit message format](#commit-message-format), release not generator and publishing platforms.

See [List of semantic-release plugins](docs/plugins.md#semantic-release-plugins).

See [Plugin developer Guide](docs/developer-guide/plugin.md#semantic-release-plugin-development) for more information on how to develop a plugin.

### Plugin types

#### verifyConditions plugin

Plugin responsible for verifying all the conditions to proceed with the release: configuration is correct, authentication token are valid, etc...

Default implementation: [npm](https://github.com/semantic-release/npm#verifyconditions) and [github](https://github.com/semantic-release/github#verifyconditions).

#### getLastRelease plugin

Plugin responsible for determining the version of the package last release.

Default implementation: [@semantic-release/npm](https://github.com/semantic-release/npm#getlastrelease).

#### analyzeCommits plugin

Plugin responsible for determining the type of the next release (`major`, `minor` or `patch`).

Default implementation: [@semantic-release/commit-analyzer](https://github.com/semantic-release/commit-analyzer).

#### verifyRelease plugin

Plugin responsible for verifying the parameters (version, type, dist-tag etc...) of the release that is about to be published match certain expectations. For example the [cracks plugin](https://github.com/semantic-release/cracks) allows to verify that if a release contains breaking changes, its type must be `major`.

Default implementation: none.

#### generateNotes plugin

Plugin responsible for generating release notes.

Default implementation: [@semantic-release/release-notes-generator](https://github.com/semantic-release/release-notes-generator).

#### publish plugin

Plugin responsible for publishing the release.

Default implementation: [npm](https://github.com/semantic-release/npm#publish) and [github](https://github.com/semantic-release/github#publish).

### Plugins configuration

Plugin can be configured by specifying the plugin's module name or file path directly as a `String` or within the `path` key of an `Object`.

Plugins specific options can be set similarly to the other semantic-release [options](#options) or within the plugin `Object`. Plugins options defined along the other semantic-release [options](#options) will apply to all plugins, while the one defined within the plugin `Object` will apply only to this specific plugin.

For example:
```json
{
  "release": {
    "verifyConditions": [
      {
        "path": "@semantic-release/exec",
        "cmd": "verify-conditions.sh"
      },
      "@semantic-release/npm",
      "@semantic-release/github"
    ],
    "analyzeCommits": "custom-plugin",
    "verifyRelease": [
      {
        "path": "@semantic-release/exec",
        "cmd": "verify-release.sh"
      },
    ],
    "generateNotes": "./build/my-plugin.js",
    "githubUrl": "https://my-ghe.com",
    "githubApiPathPrefix": "/api-prefix"
  }
}
```

With this configuration:
- the `custom-plugin` npm module will be used to [analyze commits](#analyzecommits-plugin)
- the `./build/my-plugin.js` script will be used to [generate release notes](#generatenotes-plugin)
- the [`@semantic-release/exec`](https://github.com/semantic-release/exec),  [`@semantic-release/npm`](https://github.com/semantic-release/npm) and [`@semantic-release/exec`](https://github.com/semantic-release/exec) plugins will be used to [verify conditions](#verifyconditions-plugin)
- the [`@semantic-release/exec`](https://github.com/semantic-release/exec) plugin will be used to [verify the release](#verifyrelease-plugin)
- the `cmd` option will be set to `verify-conditions.sh` only for the [`@semantic-release/exec`](https://github.com/semantic-release/exec) plugin used to [verify conditions](#verifyconditions-plugin)
- the `cmd` option will be set to `verify-release.sh` only for the [`@semantic-release/exec`](https://github.com/semantic-release/exec) plugin used to [verify the release](#verifyrelease-plugin)
- the `githubUrl` and `githubApiPathPrefix` options will be set to respectively `https://my-ghe.com` and `/api-prefix` for all plugins

## Shareable configurations

A sharable configuration is an [npm](https://www.npmjs.com/) package that exports a semantic-release configuration object. It allows to easily use the same configuration across several projects.

The shareable configurations to use can be set with the [extends](#extends) option.

See [List of semantic-release shareable configuration](docs/shareable-configurations.md#semantic-release-shareable-configurations).

See [Shareable configuration developer Guide](docs/developer-guide/shareable-configuration.md#semantic-release-shareable-config-development) for more information on how to develop a shareable configuration.

## Recipes

- [CI configurations](docs/recipes/README.md#ci-configurations)
- [Package managers and languages](docs/recipes/README.md#package-managers-and-languages)

## Frequently Asked Questions

### Why is the `package.json`’s version not updated in my repository?

semantic-release takes care of updating the `package.json`’s version before publishing to [npm](https://www.npmjs.com).

By default, only the published package will contains the version, which is the only place where it is *really* required, but the updated `package.json` will not be pushed to the Git repository

However, the [`@semantic-release/git`](https://github.com/semantic-release/git) plugin can be used to push the updated `package.json` as well as other files to the Git repository.

### How can I use a npm build script that requires the `package.json`’s version ?

The `package.json`’s version will be updated by the `semantic-release` command just before publishing to [npm](https://www.npmjs.com), therefore it won't be available for scripts ran before the `semantic-release` command.

As semantic-release uses the [npm CLI](https://docs.npmjs.com/cli/npm) to publish, all [npm hook scripts](https://docs.npmjs.com/misc/scripts#hook-scripts) will be executed. Therefore you can run your build script in the [`prepublishOnly`](https://docs.npmjs.com/misc/scripts#prepublish-and-prepare) hook. It will be executed after the `semantic-release` command update the `package.json`’s version and before publishing.

### Is there a way to preview which version would currently get published?

Yes with the [dry-run options](#dryrun) which prints to the console the next version to be published and the release notes.

### Can I use semantic-release with Yarn?

If you are using a [local semantic-release installation](#local-installation) and run multiple CI jobs with different versions, the `yarn install` command will fail with Node < 8 as semantic-release require [Node >= 8](#why-does-semantic-release-require-node-version--8). See [yarnpkg/rfcs#69](https://github.com/yarnpkg/rfcs/pull/69).

In order to run semantic-release with [Yarn](https://yarnpkg.com) you would need to:
- Use a [global semantic-release installation](#global-installation)
- Make sure to install and run the `semantic-release` command only in a CI jobs running with [Node >= 8](#why-does-semantic-release-require-node-version--8)

If your CI environment provides [nvm](https://github.com/creationix/nvm) you can switch to Node 8 before installing and running the `semantic-release` command:

```bash
$ nvm install 8 && yarn install -g semantic-release && semantic-release
```

See the [CI configuration recipes](docs/recipes/README.md#ci-configurations) for more details on specific CI environments.

### Can I use semantic-release to publish non-JavaScript packages?

Yes, semantic-release is a Node CLI application but it can be used to publish any type of packages.

To publish a non-JavaScript package you would need to:
- Use a [global semantic-release installation](#global-installation)
- Set [semantic-release options](#options) via [CLI arguments or rc file](#configuration)
- Make sure your CI job executing the `semantic-release` command has access to [Node >= 8](#why-does-semantic-release-require-node-version--8) to execute the `semantic-release` command

See the [CI configuration recipes](docs/recipes/README.md#ci-configurations) for more details on specific CI environments.

### Can I use semantic-release with any CI service?

Yes, semantic-release can be used with any CI service, as long as it provides:
- A way to set [authentication](#authentication) via environment variables
- A way to guarantee that the `semantic-release` command is [executed only after all the tests of all the jobs in the CI build pass](#run-semantic-release-only-after-all-tests-succeeded)

See the [CI configuration recipes](docs/recipes/README.md#ci-configurations) for more details on specific CI environments.

### Can I run semantic-release on my local machine rather than on a CI server?

Yes, you can by explicitly setting the [`--no-ci` CLI option](#options) option. You will also have to set the required [authentication](#authentication) via environment variables on your local machine, for example:

```bash
$ NPM_TOKEN=<your_npm_token> GH_TOKEN=<your_github_token> npm run semantic-release --no-ci
```

However this is not the recommended approach, as running unit and integration tests on an independent machine before publishing software is a crucial part of the release workflow.

### Can I use semantic-release with GitLab?

Yes, with the [`@semantic-release/gitlab-config`](https://github.com/semantic-release/gitlab-config) shareable configuration.

See the [GitLab CI recipes](docs/recipes/gitlab-ci.md#using-semantic-release-with-gitlab-ci) for the CI configuration.

### Can I use semantic-release with any Git hosted environment?

By default semantic-release uses the [`@semantic-release/github`](https://github.com/semantic-release/github) plugin to publish a [GitHub release](https://help.github.com/articles/about-releases). For other Git hosted environment the  [`@semantic-release/git`](https://github.com/semantic-release/git) and [`@semantic-release/changelog`](https://github.com/semantic-release/changelog) plugins can be used via [plugins configuration](#plugins-configuration).

See the [`@semantic-release/git`](https://github.com/semantic-release/git#semantic-releasegit) [`@semantic-release/changelog`](https://github.com/semantic-release/changelog#semantic-releasechangelog) plugins documentation for more details.

### Can I skip the release to the npm registry?

Yes, the publishing to the npm registry can be disabled with the [`npmPublish`](https://github.com/semantic-release/npm#options) option of the [`@semantic-release/npm`](https://github.com/semantic-release/npm) plugin. In addition the [`tarballDir`](https://github.com/semantic-release/npm#options) option allow to generate the package tarball in order to publish it to your repository with the [`@semantic-release/git`](https://github.com/semantic-release/git) or to a [GitHub release](https://help.github.com/articles/about-releases) with the [`@semantic-release/github`](https://github.com/semantic-release/github) plugin.

See the [`@semantic-release/npm`](https://github.com/semantic-release/npm#semantic-releasenpm) plugin documentation for more details.

### Can I use `.npmrc` options?

Yes, all the [npm configuration options](https://docs.npmjs.com/misc/config) are supported via the [`.npmrc`](https://docs.npmjs.com/files/npmrc) file at the root of your repository.

See the [`@semantic-release/npm`](https://github.com/semantic-release/npm#npm-configuration) plugin documentation for more details.

### How can I set the access level of the published npm package?

The [npm `access` option](https://docs.npmjs.com/misc/config#access) can be set in the [`.npmrc`](https://docs.npmjs.com/files/npmrc) file at the root of your repository:

```rc
access=public
```

Or with the `publishConfig.access` key in your project's `package.json`:

```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

### Can I use semantic-release to publish a package on Artifactory?

Any npm compatible registry is supported with the [`@semantic-release/npm`](https://github.com/semantic-release/npm) plugin. For Artifactory versions prior to 5.4, the legacy authentication has to be used (with `NPM_USERNAME`, `NPM_PASSWORD` and `NPM_EMAIL` [environment variables](https://github.com/semantic-release/npm#environment-variables)).

See [npm registry authentication](https://github.com/semantic-release/npm#npm-registry-authentication) for more details.

See [Artifactory - npm Registry](https://www.jfrog.com/confluence/display/RTF/Npm+Registry#NpmRegistry-AuthenticatingthenpmClient) documentation for Artifactiry configuration.

### Can I manually trigger the release of a specific version?

You can trigger a release by pushing to your Git repository. You deliberately cannot trigger a *specific* version release, because this is the whole point of semantic-release.

### Is it *really* a good idea to release on every push?

It is indeed a great idea because it *forces* you to follow best practices. If you don’t feel comfortable releasing every feature or fix on your `master` you might not treat your `master` branch as intended.

From [Understanding the GitHub Flow](https://guides.github.com/introduction/flow/index.html):

> Branching is a core concept in Git, and the entire GitHub Flow is based upon it. There's only one rule: anything in the master branch is always deployable.

If you need more control over the timing of releases, see [Triggering a release](#triggering-a-release) for different options.

### Can I set the initial release version of my package to `0.0.1`?

This is not supported by semantic-release as it's not considered a good practice, mostly because [Semantic Versioning](https://semver.org) rules applies differently to major version zero.

In early development phase when your package is not ready for production yet we recommend to publish releases on a distribution channel (for example npm’s [dist-tags](https://docs.npmjs.com/cli/dist-tag)) or to develop on a `dev` branch and merge it to `master` periodically. See [Triggering a release](#triggering-a-release) for more details on those solutions.

See [“Introduction to SemVer” - Irina Gebauer](https://blog.greenkeeper.io/introduction-to-semver-d272990c44f2) for more details on [Semantic Versioning](https://semver.org) and the recommendation to start at version `1.0.0`.

### Can I trust semantic-release with my releases?

semantic-release has a full unit and integration test suite that tests `npm` publishes against the [npm-registry-couchapp](https://github.com/npm/npm-registry-couchapp).

In addition the [verify conditions step](#release-steps) verifies that all necessary conditions for proceeding with a release are met, and a new release will be performed [only if all your tests pass](#run-semantic-release-only-after-all-tests-succeeded).

### Why does semantic-release require Node version >= 8?

semantic-release is written using the latest [ECMAScript 2017](https://www.ecma-international.org/publications/standards/Ecma-262.htm) features, without transpilation which **requires Node version 8 or higher**.

See [Node version requirement](docs/node-version.md#node-version-requirement) for more details and solutions.

## Resources

### Videos

- ["Introducing Reliable Dependency and Release Management for npm Packages" - Gregor Martynus](https://www.youtube.com/watch?v=R2RJWLcfzwc)
- ["Kill all humans" - Jan Lehnardt](https://www.youtube.com/watch?v=ZXyx_1kN1L8&t=2s)
- [Publishing JavaScript Packages" - JavaScript Air](https://javascriptair.com/episodes/2016-07-20)
- ["Managing Dependencies like a boss 😎" - JavaScript Air](https://javascriptair.com/episodes/2016-08-17)
- ["Dependency Hell Just Froze Over" - Stephan Bönnemann](https://www.youtube.com/watch?v=PA139CERNbc)
- [“semantic-release Q&A with Kent C. Dodds”](https://www.youtube.com/watch?v=g6y3DnhkjrI)
- [“We fail to follow SemVer – and why it needn’t matter” - Stephan Bönnemann](https://www.youtube.com/watch?v=tc2UgG5L7WM)

### Articles

- [“Introduction to SemVer” - Irina Gebauer](https://blog.greenkeeper.io/introduction-to-semver-d272990c44f2)

### Tutorials

- [“How to Write a JavaScript Library - Automating Releases with semantic-release” – egghead.io](https://egghead.io/lessons/javascript-automating-releases-with-semantic-release)

## Support

- [Stack Overflow](https://stackoverflow.com/questions/tagged/semantic-release)
- [Gitter chat](https://gitter.im/semantic-release/semantic-release)
- [Twitter](https://twitter.com/SemanticRelease)

## Badge

Let people know that your package is published using semantic-release by including this badge in your readme.

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

```md
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
```

## Node Support Policy

We only support [Long-Term Support](https://github.com/nodejs/Release) versions of Node starting with [Node 8.9.0 (LTS)](https://nodejs.org/en/blog/release/v8.9.0).

We specifically limit our support to LTS versions of Node, not because this package won't work on other versions, but because we have a limited amount of time, and supporting LTS offers the greatest return on that investment.

It's possible this package will work correctly on newer versions of Node. It may even be possible to use this package on older versions of Node, though that's more unlikely as we'll make every effort to take advantage of features available in the oldest LTS version we support.

As each Node LTS version reaches its end-of-life we will remove that version from the node engines property of our package's package.json file. Removing a Node version is considered a breaking change and will entail the publishing of a new major version of this package. We will not accept any requests to support an end-of-life version of Node. Any merge requests or issues supporting an end-of-life version of Node will be closed.

We will accept code that allows this package to run on newer, non-LTS, versions of Node. Furthermore, we will attempt to ensure our own changes work on the latest version of Node. To help in that commitment, our continuous integration setup runs against all LTS versions of Node in addition the most recent Node release; called current.

JavaScript package managers should allow you to install this package with any version of Node, with, at most, a warning if your version of Node does not fall within the range specified by our node engines property. If you encounter issues installing this package, please report the issue to your package manager.

## Team

| [![Stephan Bönnemann](https://github.com/boennemann.png?size=100)](https://github.com/boennemann) | [![Rolf Erik Lekang](https://github.com/relekang.png?size=100)](https://github.com/relekang) | [![Johannes Jörg Schmidt](https://github.com/jo.png?size=100)](https://github.com/jo) | [![Gregor Martynus](https://github.com/gr2m.png?size=100)](https://github.com/gr2m) | [![Pierre Vanduynslager](https://github.com/finnp.png?size=100)](https://github.com/finnp) | [![Pierre Vanduynslager](https://github.com/pvdlg.png?size=100)](https://github.com/pvdlg) | [![Christoph Witzko](https://github.com/christophwitzko.png?size=100)](https://github.com/christophwitzko) |
|---------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| [Stephan Bönnemann](https://github.com/boennemann)                                                | [Rolf Erik Lekang](https://github.com/relekang)                                              | [Johannes Jörg Schmidt](https://github.com/jo)                                        | [Gregor Martynus](https://github.com/gr2m)                                          | [Finn Pauls](https://github.com/finnp)                                                     | [Pierre Vanduynslager](https://github.com/pvdlg)                                           | [Christoph Witzko](https://github.com/christophwitzko)                                                     |

[![](https://cloud.githubusercontent.com/assets/908178/6091690/cc86f58c-aeb8-11e4-94cb-15f15f486cde.png)](https://twitter.com/trodrigues/status/509301317467373571)

# Frequently Asked Questions

## Why is the `package.json`’s version not updated in my repository?

**semantic-release** takes care of updating the `package.json`’s version before publishing to [npm](https://www.npmjs.com).

By default, only the published package will contains the version, which is the only place where it is *really* required, but the updated `package.json` will not be pushed to the Git repository

However, the [`@semantic-release/git`](https://github.com/semantic-release/git) plugin can be used to push the updated `package.json` as well as other files to the Git repository.

## How can I use a npm build script that requires the `package.json`’s version ?

The `package.json`’s version will be updated by the `semantic-release` command just before publishing to [npm](https://www.npmjs.com), therefore it won't be available for scripts ran before the `semantic-release` command.

As semantic-release uses the [npm CLI](https://docs.npmjs.com/cli/npm) to publish, all [npm hook scripts](https://docs.npmjs.com/misc/scripts#hook-scripts) will be executed. Therefore you can run your build script in the [`prepublishOnly`](https://docs.npmjs.com/misc/scripts#prepublish-and-prepare) hook. It will be executed after the `semantic-release` command update the `package.json`’s version and before publishing.

## Is there a way to preview which version would currently get published?

Yes with the [dry-run options](../usage/configuration.md#dryrun) which prints to the console the next version to be published and the release notes.

## Can I use semantic-release with Yarn?

If you are using a [local](../usage/installation.md#local-installation) **semantic-release** installation and run multiple CI jobs with different versions, the `yarn install` command will fail on jobs running with Node < 8 as **semantic-release** requires [Node >= 8.3](#why-does-semantic-release-require-node-version--83) and specifies it in its `package.json`s [`engines`](https://docs.npmjs.com/files/package.json#engines) key.

The recommended solution is to use the [Yarn](https://yarnpkg.com) [--ignore-engines](https://yarnpkg.com/en/docs/cli/install#toc-yarn-install-ignore-engines) option to install the project dependencies on the CI environment, so Yarn will ignore the **semantic-release**'s `engines` key:

```bash
$ yarn install --ignore-engines
```

**Note**: Several CI services use Yarn by default if your repository contains a `yarn.lock` file. So you should override the install step to specify `yarn install --ignore-engines`.

Alternatively you can use a [global](../usage/installation.md#global-installation) **semantic-release** installation and make sure to install and run the `semantic-release` command only in a CI jobs running with Node >= 8.3.

If your CI environment provides [nvm](https://github.com/creationix/nvm) you can switch to Node 8 before installing and running the `semantic-release` command:

```bash
$ nvm install 8 && yarn install -g semantic-release && semantic-release
```

See the [CI configuration recipes](../recipes/README.md#ci-configurations) for more details on specific CI environments.

## Can I use semantic-release to publish non-JavaScript packages?

Yes, **semantic-release** is a Node CLI application but it can be used to publish any type of packages.

To publish a non-Node package (without a `package.json`) you would need to:
- Use a [global](../usage/installation.md#global-installation) **semantic-release** installation
- Set **semantic-release** [options](../usage/configuration.md#options) via [CLI arguments or rc file](../usage/configuration.md#configuration)
- Make sure your CI job executing the `semantic-release` command has access to [Node >= 8](#why-does-semantic-release-require-node-version--83) to execute the `semantic-release` command

See the [CI configuration recipes](../usage/ci-configuration.md) for more details on specific CI environments.

## Can I use semantic-release with any CI service?

Yes, **semantic-release** can be used with any CI service, as long as it provides:
- A way to set [authentication](../usage/ci-configuration.md#authentication) via environment variables
- A way to guarantee that the `semantic-release` command is [executed only after all the tests of all the jobs in the CI build pass](../usage/ci-configuration.md#run-semantic-release-only-after-all-tests-succeeded)

See the [CI configuration recipes](../usage/ci-configuration.md) for more details on specific CI environments.

## Can I run semantic-release on my local machine rather than on a CI server?

Yes, you can by explicitly setting the [`--no-ci` CLI option](../usage/configuration.md#options) option. You will also have to set the required [authentication](../usage/ci-configuration.md#authentication) via environment variables on your local machine, for example:

```bash
$ NPM_TOKEN=<your_npm_token> GH_TOKEN=<your_github_token> npm run semantic-release --no-ci
```

However this is not the recommended approach, as running unit and integration tests on an independent machine before publishing software is a crucial part of the release workflow.

## Can I use semantic-release with GitLab?

Yes, with the [`@semantic-release/gitlab-config`](https://github.com/semantic-release/gitlab-config) shareable configuration.

See the [GitLab CI recipes](../recipes/gitlab-ci.md#using-semantic-release-with-gitlab-ci) for the CI configuration.

## Can I use semantic-release with any Git hosted environment?

By default **semantic-release** uses the [`@semantic-release/github`](https://github.com/semantic-release/github) plugin to publish a [GitHub release](https://help.github.com/articles/about-releases). For other Git hosted environment the  [`@semantic-release/git`](https://github.com/semantic-release/git) and [`@semantic-release/changelog`](https://github.com/semantic-release/changelog) plugins can be used via [plugins configuration](../usage/plugins.md#configuration).

See the [`@semantic-release/git`](https://github.com/semantic-release/git#semantic-releasegit) [`@semantic-release/changelog`](https://github.com/semantic-release/changelog#semantic-releasechangelog) plugins documentation for more details.

## Can I skip the release to the npm registry?

Yes, the publishing to the npm registry can be disabled with the [`npmPublish`](https://github.com/semantic-release/npm#options) option of the [`@semantic-release/npm`](https://github.com/semantic-release/npm) plugin. In addition the [`tarballDir`](https://github.com/semantic-release/npm#options) option allow to generate the package tarball in order to publish it to your repository with the [`@semantic-release/git`](https://github.com/semantic-release/git) or to a [GitHub release](https://help.github.com/articles/about-releases) with the [`@semantic-release/github`](https://github.com/semantic-release/github) plugin.

See the [`@semantic-release/npm`](https://github.com/semantic-release/npm#semantic-releasenpm) plugin documentation for more details.

## Can I use `.npmrc` options?

Yes, all the [npm configuration options](https://docs.npmjs.com/misc/config) are supported via the [`.npmrc`](https://docs.npmjs.com/files/npmrc) file at the root of your repository.

See the [`@semantic-release/npm`](https://github.com/semantic-release/npm#npm-configuration) plugin documentation for more details.

## How can I set the access level of the published npm package?

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

## Can I use semantic-release to publish a package on Artifactory?

Any npm compatible registry is supported with the [`@semantic-release/npm`](https://github.com/semantic-release/npm) plugin. For Artifactory versions prior to 5.4, the legacy authentication has to be used (with `NPM_USERNAME`, `NPM_PASSWORD` and `NPM_EMAIL` [environment variables](https://github.com/semantic-release/npm#environment-variables)).

See [npm registry authentication](https://github.com/semantic-release/npm#npm-registry-authentication) for more details.

See [Artifactory - npm Registry](https://www.jfrog.com/confluence/display/RTF/Npm+Registry#NpmRegistry-AuthenticatingthenpmClient) documentation for Artifactiry configuration.

## Can I manually trigger the release of a specific version?

You can trigger a release by pushing to your Git repository. You deliberately cannot trigger a *specific* version release, because this is the whole point of semantic-release.

### Can I exclude commits from the analysis?

Yes, every commits that contains `[skip release]` or `[release skip]` in their message will be excluded from the commit analysis and won't participate in the release type determination.

## Is it *really* a good idea to release on every push?

It is indeed a great idea because it *forces* you to follow best practices. If you don’t feel comfortable releasing every feature or fix on your `master` you might not treat your `master` branch as intended.

From [Understanding the GitHub Flow](https://guides.github.com/introduction/flow/index.html):

> Branching is a core concept in Git, and the entire GitHub Flow is based upon it. There's only one rule: anything in the master branch is always deployable.

If you need more control over the timing of releases, see [Triggering a release](../../README.md#triggering-a-release) for different options.

## Can I set the initial release version of my package to `0.0.1`?

This is not supported by **semantic-release** as it's not considered a good practice, mostly because [Semantic Versioning](https://semver.org) rules applies differently to major version zero.

In early development phase when your package is not ready for production yet we recommend to publish releases on a distribution channel (for example npm’s [dist-tags](https://docs.npmjs.com/cli/dist-tag)) or to develop on a `dev` branch and merge it to `master` periodically. See [Triggering a release](../../README.md#triggering-a-release) for more details on those solutions.

See [“Introduction to SemVer” - Irina Gebauer](https://blog.greenkeeper.io/introduction-to-semver-d272990c44f2) for more details on [Semantic Versioning](https://semver.org) and the recommendation to start at version `1.0.0`.

## Can I trust semantic-release with my releases?

**semantic-release** has a full unit and integration test suite that tests `npm` publishes against the [npm-registry-couchapp](https://github.com/npm/npm-registry-couchapp).

In addition the [verify conditions step](../../README.md#release-steps) verifies that all necessary conditions for proceeding with a release are met, and a new release will be performed [only if all your tests pass](../usage/ci-configuration.md#run-semantic-release-only-after-all-tests-succeeded).

## Why does semantic-release require Node version >= 8.3?

**semantic-release** is written using the latest [ECMAScript 2017](https://www.ecma-international.org/publications/standards/Ecma-262.htm) features, without transpilation which **requires Node version 8.3 or higher**.

See [Node version requirement](../support/node-version.md#node-version-requirement) for more details and solutions.

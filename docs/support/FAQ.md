# Frequently Asked Questions

## Why is the `package.json`’s version not updated in my repository?

[`@semantic-release/npm`](https://github.com/semantic-release/npm) takes care of updating the `package.json`’s version before publishing to [npm](https://www.npmjs.com).

By default, only the published package will contain the version, which is the only place where it is *really* required, but the updated `package.json` will not be pushed to the Git repository

However, the [`@semantic-release/git`](https://github.com/semantic-release/git) plugin can be used to push the updated `package.json` as well as other files to the Git repository.

If you wish to only update the `package.json` and push via Git you can set the project to `"private": true,` within your `package.json` to prevent publishing to [the npm registry](https://www.npmjs.com).

## How can I use a npm build script that requires the `package.json`’s version ?

The `package.json`’s version will be updated by the `semantic-release` command just before publishing to [npm](https://www.npmjs.com), therefore it won't be available for scripts ran before the `semantic-release` command.

As the [`@semantic-release/npm`](https://github.com/semantic-release/npm) plugin uses the [npm CLI](https://docs.npmjs.com/cli/npm) to update the `package.json` version and publish the package, all [npm hook scripts](https://docs.npmjs.com/misc/scripts#description) will be executed.

You can run your build script in:
- the `prepublishOnly` or `prepack` hook so it will be executed during the `publish` step of `@semantic-release/npm`
- the `postversion` hook so it will be executed during the `prepare` step of `@semantic-release/npm`, which allow for example to update files before committing them with the [`@semantic-release/git`](https://github.com/semantic-release/git) plugin

If using npm hook scripts is not possible, and alternative solution is to [`@semantic-release/exec`](https://github.com/semantic-release/exec) plugin to run your script in the `prepare` step:
```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    ["@semantic-release/exec", {
      "prepareCmd": "./my-build-script.sh ${nextRelease.version}",
    }],
  ]
}
```

## Is there a way to preview which version would currently get published?

Yes with the [dry-run options](../usage/configuration.md#dryrun) which prints to the console the next version to be published and the release notes.

## Can I use semantic-release to publish non-JavaScript packages?

Yes, **semantic-release** is a Node CLI application, but it can be used to publish any type of packages.

To publish a non-Node package (without a `package.json`) you would need to:
- Use a [global](../usage/installation.md#global-installation) **semantic-release** installation
- Set **semantic-release** [options](../usage/configuration.md#options) via [CLI arguments or `.rc` file](../usage/configuration.md#configuration)
- Make sure your CI job executing the `semantic-release` command has access to a version of Node that [meets our version requirement](./node-version.md) to execute the `semantic-release` command

See the [CI configuration recipes](../recipes/release-workflow/README.md#ci-configurations) for more details on specific CI environments.

In addition, you will need to configure the **semantic-release** [plugins](../usage/plugins.md#plugins) to disable the [`@semantic-release/npm`](https://github.com/semantic-release/npm) plugin which is used by default and use a plugin for your project type.

If there is no specific plugin for your project type you can use the [`@semantic-release/exec`](https://github.com/semantic-release/exec) plugin to publish the release with a shell command.

Here is a basic example to create [GitHub releases](https://help.github.com/articles/about-releases) and use a shell command to publish:

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/github",
    ["@semantic-release/exec", {
      "prepareCmd" : "set-version ${nextRelease.version}",
      "publishCmd" : "publish-package"
      }]
  ]
}
```

**Note**: This is a theoretical example where the command `set-version` update the project version with the value passed as its first argument and `publish-package` publishes the package to a registry.

See the [package managers and languages recipes](../recipes/release-workflow/README.md#package-managers-and-languages) for more details on specific project types.

## Can I use semantic-release with any CI service?

Yes, **semantic-release** can be used with any CI service, as long as it provides:
- A way to set [authentication](../usage/ci-configuration.md#authentication) via environment variables
- A way to guarantee that the `semantic-release` command is [executed only after all the tests of all the jobs in the CI build pass](../usage/ci-configuration.md#run-semantic-release-only-after-all-tests-succeeded)

See the [CI configuration recipes](../recipes/release-workflow/README.md#ci-configurations) for more details on specific CI environments.

## Can I run semantic-release on my local machine rather than on a CI server?

Yes, you can by explicitly setting the [`--no-ci` CLI option](../usage/configuration.md#ci) option. You will also have to set the required [authentication](../usage/ci-configuration.md#authentication) via environment variables on your local machine, for example:

```bash
$ NPM_TOKEN=<your_npm_token> GH_TOKEN=<your_github_token> npx semantic-release --no-ci
```

However this is not the recommended approach, as running unit and integration tests on an independent machine before publishing software is a crucial part of the release workflow.

## Can I use semantic-release with GitLab?

Yes, with the [`@semantic-release/gitlab-config`](https://github.com/semantic-release/gitlab-config) shareable configuration.

See the [GitLab CI recipes](../recipes/ci-configurations/gitlab-ci.md#using-semantic-release-with-gitlab-ci) for the CI configuration.

## Can I use semantic-release with any Git hosted environment?

By default **semantic-release** uses the [`@semantic-release/github`](https://github.com/semantic-release/github) plugin to publish a [GitHub release](https://help.github.com/articles/about-releases). For other Git hosted environment the  [`@semantic-release/git`](https://github.com/semantic-release/git) and [`@semantic-release/changelog`](https://github.com/semantic-release/changelog) plugins can be used via [plugins configuration](../usage/plugins.md).

See the [`@semantic-release/git`](https://github.com/semantic-release/git#semantic-releasegit) [`@semantic-release/changelog`](https://github.com/semantic-release/changelog#semantic-releasechangelog) plugins documentation for more details.

## Can I skip the release to the npm registry?

Yes, the publishing to the npm registry can be disabled with the [`npmPublish`](https://github.com/semantic-release/npm#options) option of the [`@semantic-release/npm`](https://github.com/semantic-release/npm) plugin. In addition the [`tarballDir`](https://github.com/semantic-release/npm#options) option allow to generate the package tarball in order to publish it to your repository with the [`@semantic-release/git`](https://github.com/semantic-release/git) or to a [GitHub release](https://help.github.com/articles/about-releases) with the [`@semantic-release/github`](https://github.com/semantic-release/github) plugin.

See the [`@semantic-release/npm`](https://github.com/semantic-release/npm#semantic-releasenpm) plugin documentation for more details.

## How can I revert a release?

If you have introduced a breaking bug in a release you have 2 options:
- If you have a fix immediately ready, commit and push it (or merge it via a pull request) to the release branch
- Otherwise, [revert the commit](https://git-scm.com/docs/git-revert) that introduced the bug and push the revert commit (or merge it via a pull request) to the release branch

In both cases **semantic-release** will publish a new release, so your package users will get the fixed/reverted version.

Depending on the package manager you are using, you might be able to un-publish or deprecate a release, in order to prevent users from downloading it by accident. For example, npm allows you to [un-publish](https://docs.npmjs.com/cli/unpublish) [within 72 hours](https://www.npmjs.com/policies/unpublish) after release. You may also [deprecate](https://docs.npmjs.com/cli/deprecate) a release if you would rather avoid un-publishing.

In any case **do not remove the Git tag associated with the buggy version**, otherwise **semantic-release** will later try to republish that version. Publishing a version after un-publishing is not supported by most package managers.

**Note**: If you are using the default [Angular Commit Message Conventions](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines) be aware that it uses a different revert commit format than the standard one created by [git revert](https://git-scm.com/docs/git-revert), contrary to what is [claimed in the  convention](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#revert). Therefore, if you revert a commit with [`git revert`](https://git-scm.com/docs/git-revert), use the [`--edit` option](https://git-scm.com/docs/git-revert#git-revert---edit) to format the message according to the [Angular revert commit message format](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#revert). See [conventional-changelog/conventional-changelog#348](https://github.com/conventional-changelog/conventional-changelog/issues/348) for more details.

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

See [Artifactory - npm Registry](https://www.jfrog.com/confluence/display/RTF/Npm+Registry#NpmRegistry-AuthenticatingthenpmClient) documentation for Artifactory configuration.

## Can I manually trigger the release of a specific version?

You can trigger a release by pushing to your Git repository. You deliberately cannot trigger a *specific* version release, because this is the whole point of semantic-release.

## Can I exclude commits from the analysis?

Yes, every commits that contains `[skip release]` or `[release skip]` in their message will be excluded from the commit analysis and won't participate in the release type determination.

## How can I change the type of commits that trigger a release?

By default **semantic-release** uses the [Angular Commit Message Conventions](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines) and triggers releases based on the following rules:

| Commit                      | Release type               |
|-----------------------------|----------------------------|
| Commit with breaking change | ~~Major~~ Breaking release |
| Commit with type `feat`     | ~~Minor~~ Feature release  |
| Commit with type `fix`      | Patch release              |
| Commit with type `perf`     | Patch release              |

See the [`@semantic-release/npm`](https://github.com/semantic-release/npm#npm-configuration) plugin documentation for more details.

This is fully customizable with the [`@semantic-release/commit-analyzer`](https://github.com/semantic-release/commit-analyzer) plugin's [`release-rules` option](https://github.com/semantic-release/commit-analyzer#release-rules).

## Is it *really* a good idea to release on every push?

It is indeed a great idea because it *forces* you to follow best practices. If you don’t feel comfortable releasing every feature or fix on your `master` you might not treat your `master` branch as intended.

From [Understanding the GitHub Flow](https://guides.github.com/introduction/flow/index.html):

> Branching is a core concept in Git, and the entire GitHub Flow is based upon it. There's only one rule: anything in the master branch is always deployable.

If you need more control over the timing of releases, see [Triggering a release](../../README.md#triggering-a-release) for different options.

**Note**: Only the codebase changes altering the published package will trigger a release (for example new features, bug fixes or performance improvements would trigger a release while refactoring or changing code style would not). See [How can I change the type of commits that trigger a release?](#how-can-i-change-the-type-of-commits-that-trigger-a-release) for more details.

## Can I set the initial release version of my package to `0.0.1`?

This is not supported by **semantic-release** as it's not considered a good practice, mostly because [Semantic Versioning](https://semver.org) rules applies differently to major version zero.

If your project is under heavy development, with frequent breaking changes, and is not production ready yet we recommend [publishing pre-releases](../recipes/release-workflow/pre-releases.md#publishing-pre-releases).

See [“Introduction to SemVer” - Irina Gebauer](https://blog.greenkeeper.io/introduction-to-semver-d272990c44f2) for more details on [Semantic Versioning](https://semver.org) and the recommendation to start at version `1.0.0`.

## Can I trust semantic-release with my releases?

**semantic-release** has a full unit and integration test suite that tests `npm` publishes against the [verdaccio](https://www.npmjs.com/package/verdaccio).

In addition, the [verify conditions step](../../README.md#release-steps) verifies that all necessary conditions for proceeding with a release are met, and a new release will be performed [only if all your tests pass](../usage/ci-configuration.md#run-semantic-release-only-after-all-tests-succeeded).

## What is npx?

[`npx`](https://www.npmjs.com/package/npx) – short for "npm exec" – is a CLI to find and execute npm binaries within the local `node_modules` folder or in the $PATH. If a binary can't be located npx will download the required package and execute it from its cache location.
The tool is bundled with [npm](https://www.npmjs.com/package/npm) >= 5.2, or can be installed via `npm install -g npx`.
For more details and motivation read the [introductory blog post](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) by [@zkat](https://github.com/zkat).

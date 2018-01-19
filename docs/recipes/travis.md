# Using semantic-release with [Travis CI](https://travis-ci.org)

## Environment variables

The [Authentication](../usage/ci-configuration.md#authentication) environment variables can be configured in [Travis Repository Settings](https://docs.travis-ci.com/user/environment-variables/#defining-variables-in-repository-Settings) or with the [travis env set CLI](https://github.com/travis-ci/travis.rb#env).

Alternatively, the default `NPM_TOKEN` and `GH_TOKEN` can be easily [setup with semantic-release-cli](../usage/ci-configuration.md#automatic-setup-with-semantic-release-cli).

## Single Node job configuration

For projects that require to be tested only with a single [Node version](https://docs.travis-ci.com/user/getting-started/#Selecting-a-different-programming-language) on [one Operating System](https://docs.travis-ci.com/user/getting-started/#Selecting-infrastructure-(optional)).

**Note**: [Node 8 is the minimal version required](../support/FAQ.md#why-does-semantic-release-require-node-version--8).

### `.travis.yml` configuration for single Node job

This example is a minimal configuration for semantic-release with a build running Node 8 on Linux. See [Travis - Customizing the Build](https://docs.travis-ci.com/user/customizing-the-build) for additional configuration options.

It's recommended to run the `semantic-release` command in the [Travis `deploy` step](https://docs.travis-ci.com/user/customizing-the-build/#The-Build-Lifecycle) so if an error occurs the build will fail and Travis will send a notification.

**Note**: It's not recommended to run the `semantic-release` command in the Travis `script` step as each script in this step will be executed regardless of the outcome of the previous one. See [travis-ci/travis-ci#1066](https://github.com/travis-ci/travis-ci/issues/1066).

**Note**: The`semantic-release` execution command varies depending if you are using a [local](../usage/installation.md#local-installation) or [global](../usage/installation.md#global-installation) semantic-release installation.

```yaml
language: node_js

node_js: 8

script:
  # Run tests
  - npm run test

deploy:
  provider: script
  skip_cleanup: true
  script:
    # Only for a local semantic-release installation
    - npm run semantic-release
    # Only for a global semantic-release installation
    - npm install -g semantic-release && semantic-release
```

### `package.json` configuration for single Node job

A `package.json` is required only for [local](../usage/installation.md#local-installation) **semantic-release** installation.

```json
{
  "devDependencies": {
    "semantic-release": "^11.0.0"
  },
  "scripts": {
    "semantic-release": "semantic-release"
  }
}
```

## Multiple Node jobs configuration

For projects that require to be tested with multiple [Node versions](https://docs.travis-ci.com/user/languages/javascript-with-nodejs/#Specifying-Node.js-versions) and/or on multiple [Operating Systems](https://docs.travis-ci.com/user/multi-os).

**Note**: At least one job must run a [Node >= 8 version](../support/FAQ.md#why-does-semantic-release-require-node-version--83).

### `.travis.yml` configuration for multiple Node jobs

This example is a minimal configuration for **semantic-release** with a build running Node 4, 6 and 8 on Linux and OSX. See [Travis - Customizing the Build](https://docs.travis-ci.com/user/customizing-the-build) for additional configuration options.

This example uses [`travis-deploy-once`](https://github.com/semantic-release/travis-deploy-once) in order to command [Run `semantic-release` only after all tests succeeded](../usage/ci-configuration.md#run-semantic-release-only-after-all-tests-succeeded). Alternatively you can use [Travis CI Build Stages recipe](travis-build-stages.md).

It's recommended to run the `semantic-release` command in the [Travis `deploy` step](https://docs.travis-ci.com/user/customizing-the-build/#The-Build-Lifecycle) so if an error occurs the build will fail and Travis will send a notification.

**Note**: It's not recommended to run the `semantic-release` command in the Travis `script` step as each script in this step will be executed regardless of the outcome of the previous one. See [travis-ci/travis-ci#1066](https://github.com/travis-ci/travis-ci/issues/1066).

**Note**: The`semantic-release` execution command varies depending if you are using a [local](../usage/installation.md#local-installation) or [global](../usage/installation.md#global-installation) **semantic-release** installation.

```yaml
language: node_js

node_js:
  - 8
  - 6
  - 4

os:
  - linux
  - osx

script:
  # Run tests
  - npm run test

deploy:
  provider: script
  skip_cleanup: true
  script:
    # Only for a local semantic-release installation
    - npm run travis-deploy-once "npm run semantic-release"
    # Only for a global semantic-release installation
    - npm install -g travis-deploy-once semantic-release && travis-deploy-once "semantic-release"
```

**Note**: See the `travis-deploy-once` [`pro`](https://github.com/semantic-release/travis-deploy-once#-p---pro) and [`travis-url`](https://github.com/semantic-release/travis-deploy-once#-u---travis-url) options for using with [Travis Pro](https://docs.travis-ci.com/user/travis-pro) and [Travis Enterprise](https://enterprise.travis-ci.com).

### `package.json` configuration for multiple Node jobs

A `package.json` is required only for [local](../usage/installation.md#local-installation) **semantic-release** installation.

```json
{
  "devDependencies": {
    "semantic-release": "^12.0.0",
    "travis-deploy-once": "^4.0.0"
  },
  "scripts": {
    "semantic-release": "semantic-release",
    "travis-deploy-once": "travis-deploy-once"
  }
}
```

## Non-JavaScript projects configuration

For projects that require to be tested with one or multiple version of a Non-JavaScript [language](https://docs.travis-ci.com/user/languages), optionally on multiple [Operating Systems](https://docs.travis-ci.com/user/multi-os).

This recipe cover the Travis specifics only. See [Non JavaScript projects recipe](../support/FAQ.md#can-i-use-semantic-release-to-publish-non-javascript-packages) for more information on the **semantic-release** configuration.

### `.travis.yml` configuration for non-JavaScript projects

This example is a minimal configuration for semantic-release with a build running [Go 1.6 and 1.7](https://docs.travis-ci.com/user/languages/go) on Linux and OSX. See [Travis - Customizing the Build](https://docs.travis-ci.com/user/customizing-the-build) for additional configuration options.

This example uses [`travis-deploy-once`](https://github.com/semantic-release/travis-deploy-once) in order to [run `semantic-release` only after all tests succeeded](../usage/ci-configuration.md#run-semantic-release-only-after-all-tests-succeeded). Alternatively you can use [Travis CI Build Stages recipe](travis-build-stages.md).

It's recommended to run the `semantic-release` command in the [Travis `deploy` step](https://docs.travis-ci.com/user/customizing-the-build/#The-Build-Lifecycle) so if an error occurs the build will fail and Travis will send a notification.

**Note**: It's not recommended to run the `semantic-release` command in the Travis `script` step as each script in this step will be executed regardless of the outcome of the previous one. See [travis-ci/travis-ci#1066](https://github.com/travis-ci/travis-ci/issues/1066).

```yaml
language: go

go:
  - 1.6
  - 1.7

os:
  - linux
  - osx

script:
  # Run tests
  - go test -v ./...

deploy:
  provider: script
  skip_cleanup: true
  script:
    # Use nvm to install and use the Node LTS version (nvm is installed on all Travis images)
    - nvm install lts/*
    # Install travis-deploy-once and semantic-release
    - npm install -g travis-deploy-once semantic-release
    # Run semantic-release only on job, after all other are successful
    - travis-deploy-once "semantic-release"
```

**Note**: See the `travis-deploy-once` [`pro`](https://github.com/semantic-release/travis-deploy-once#-p---pro) and [`travis-url`](https://github.com/semantic-release/travis-deploy-once#-u---travis-url) options for using with [Travis Pro](https://docs.travis-ci.com/user/travis-pro) and [Travis Enterprise](https://enterprise.travis-ci.com).

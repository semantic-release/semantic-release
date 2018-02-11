# Using semantic-release with [Travis CI build stages](https://docs.travis-ci.com/user/build-stages)

## Environment variables

The [Authentication](../usage/ci-configuration.md#authentication) environment variables can be configured in [Travis Repository Settings](https://docs.travis-ci.com/user/environment-variables/#defining-variables-in-repository-Settings) or with the [travis env set CLI](https://github.com/travis-ci/travis.rb#env).

Alternatively, the default `NPM_TOKEN` and `GH_TOKEN` can be easily [setup with semantic-release-cli](../usage/ci-configuration.md#automatic-setup-with-semantic-release-cli).

## Multiple Node jobs configuration

### `.travis.yml` configuration for multiple Node jobs

This example is a minimal configuration for **semantic-release** with a build running Node 6 and 8. See [Travis - Customizing the Build](https://docs.travis-ci.com/user/customizing-the-build) for additional configuration options.

This example creates a `release` [build stage](https://docs.travis-ci.com/user/build-stages) that [runs `semantic-release` only after all test jobs are successful](../usage/ci-configuration.md#run-semantic-release-only-after-all-tests-succeeded).

It's recommended to run the `semantic-release` command in the [Travis `deploy` step](https://docs.travis-ci.com/user/customizing-the-build/#The-Build-Lifecycle) so if an error occurs the build will fail and Travis will send a notification.

**Note**: It's not recommended to run the `semantic-release` command in the Travis `script` step as each script in this step will be executed regardless of the outcome of the previous one. See [travis-ci/travis-ci#1066](https://github.com/travis-ci/travis-ci/issues/1066).

**Advanced configuration**: Running the tests in the `script` step of the `release` stage is not necessary as the previous stage(s) already ran them. To increase speed, the `script` step of the `release` stage can be overwritten to skip the tests. Note that other commands such as build or compilation might still be required.

```yaml
language: node_js

node_js:
  - 8
  - 6

jobs:
  include:
    # Define the release stage that runs semantic-release
    - stage: release
      node_js: lts/*
      # Advanced: optionally overwrite your default `script` step to skip the tests
      # script: skip
      deploy:
        provider: script
        skip_cleanup: true
        script:
          - npx semantic-release
```

### `package.json` configuration for multiple Node jobs

A `package.json` is required only for [local](../usage/installation.md#local-installation) **semantic-release** installation.

```json
{
  "devDependencies": {
    "semantic-release": "^12.0.0"
  }
}
```

## Non-JavaScript projects configuration

For projects that require to be tested with one or multiple version of a Non-JavaScript [language](https://docs.travis-ci.com/user/languages), optionally on multiple [Operating Systems](https://docs.travis-ci.com/user/multi-os).

This recipe cover the Travis specifics only. See [Non JavaScript projects recipe](../support/FAQ.md#can-i-use-semantic-release-to-publish-non-javascript-packages) for more information on the **semantic-release** configuration.

### `.travis.yml` configuration for non-JavaScript projects

This example is a minimal configuration for **semantic-release** with a build running [Go 1.6 and 1.7](https://docs.travis-ci.com/user/languages/go). See [Travis - Customizing the Build](https://docs.travis-ci.com/user/customizing-the-build) for additional configuration options.

This example creates a `release` [build stage](https://docs.travis-ci.com/user/build-stages) that [runs `semantic-release` only after all test jobs are successful](../usage/ci-configuration.md#run-semantic-release-only-after-all-tests-succeeded).

It's recommended to run the `semantic-release` command in the [Travis `deploy` step](https://docs.travis-ci.com/user/customizing-the-build/#The-Build-Lifecycle) so if an error occurs the build will fail and Travis will send a notification.

**Note**: It's not recommended to run the `semantic-release` command in the Travis `script` step as each script in this step will be executed regardless of the outcome of the previous one. See [travis-ci/travis-ci#1066](https://github.com/travis-ci/travis-ci/issues/1066).

**Advanced configuration**: Running the tests in the `script` step of the `release` stage is not necessary as the previous stage(s) already ran them. To increase speed, the `script` step of the `release` stage can be overwritten to skip the tests. Note that other commands such as build or compilation might still be required.

```yaml
language: go

go:
  - 1.6
  - 1.7

jobs:
  include:
    # Define the release stage that runs semantic-release
    - stage: release
      # Advanced: optionally overwrite your default `script` step to skip the tests
      # script:
      #   - make
      deploy:
        provider: script
        skip_cleanup: true
        script:
          # Use nvm to install and use the Node LTS version (nvm is installed on all Travis images)
          - nvm install lts/*
          - npx semantic-release
```

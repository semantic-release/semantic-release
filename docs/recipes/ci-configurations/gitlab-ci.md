# Using semantic-release with [GitLab CI](https://about.gitlab.com/features/gitlab-ci-cd)

## Environment variables

The [Authentication](../../usage/ci-configuration.md#authentication) environment variables can be configured with [Protected variables](https://docs.gitlab.com/ce/ci/variables/README.html#protected-environment-variables).

**Note**: Make sure to configure your release branch as [protected](https://docs.gitlab.com/ce/user/project/protected_branches.html) in order for the CI/CD build to access the protected variables.

## npm provenance

Since GitLab CI is a [supported provider](https://docs.npmjs.com/generating-provenance-statements#provenance-limitations) for [npm provenance](https://docs.npmjs.com/generating-provenance-statements), it is recommended to enable this to increase supply-chain security for your npm packages.
Find more detail about configuring npm to publish with provenance through semantic-release [in the documentation for our npm plugin](https://github.com/semantic-release/npm#npm-provenance).

## Node project configuration

GitLab CI supports [Pipelines](https://docs.gitlab.com/ee/ci/pipelines.html) allowing to test on multiple Node versions and publishing a release only when all test pass.

**Note**: The publish pipeline must run a [Node version that meets our version requirement](../../support/node-version.md).

### `.gitlab-ci.yml` configuration for Node projects

This example is a minimal configuration for **semantic-release** with a build running Node 10 and 12. See [GitLab CI - Configuration of your jobs with `.gitlab-ci.yml`](https://docs.gitlab.com/ee/ci/yaml/README.html) for additional configuration options.

**Note**: The`semantic-release` execution command varies depending on whether you are using a [local](../../usage/installation.md#local-installation) or [global](../../usage/installation.md#global-installation) **semantic-release** installation.

```yaml
# The release pipeline will run only if all jobs in the test pipeline are successful
stages:
  - test
  - release

before_script:
  - npm install

node:10:
  image: node:10
  stage: test
  script:
    - npm test

node:12:
  image: node:12
  stage: test
  script:
    - npm test

publish:
  image: node:12
  stage: release
  script:
    - npx semantic-release
```

### `.gitlab-ci.yml` configuration for all projects

This example is a minimal configuration for **semantic-release** with a build running Node 10 and 12. See [GitLab CI - Configuration of your jobs with `.gitlab-ci.yml`](https://docs.gitlab.com/ee/ci/yaml/README.html) for additional configuration options.

**Note**: The`semantic-release` execution command varies depending if you are using a [local](../../usage/installation.md#local-installation) or [global](../../usage/installation.md#global-installation) **semantic-release** installation.

```yaml
# The release pipeline will run only on the master branch a commit is triggered
stages:
  - release

release:
  image: node:10-buster-slim
  stage: release
  before_script:
    - apt-get update && apt-get install -y --no-install-recommends git-core ca-certificates
    - npm install -g semantic-release @semantic-release/gitlab
  script:
    - semantic-release
  rules:
    - if: $CI_COMMIT_BRANCH == "master"

release:
  image: node:12-buster-slim
  stage: release
  before_script:
    - apt-get update && apt-get install -y --no-install-recommends git-core ca-certificates
    - npm install -g semantic-release @semantic-release/gitlab
  script:
    - semantic-release
  rules:
    - if: $CI_COMMIT_BRANCH == "master"
```

### `package.json` configuration

A `package.json` is required only for [local](../../usage/installation.md#local-installation) **semantic-release** installation.

```json
{
  "devDependencies": {
    "semantic-release": "^15.0.0"
  }
}
```

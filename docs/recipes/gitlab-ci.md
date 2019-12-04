# Using semantic-release with [GitLab CI](https://about.gitlab.com/features/gitlab-ci-cd)

## Environment variables

The [Authentication](../usage/ci-configuration.md#authentication) environment variables can be configured with [Protected variables](https://docs.gitlab.com/ce/ci/variables/README.html#protected-environment-variables).

**Note**: Make sure to configure your release branch as [protected](https://docs.gitlab.com/ce/user/project/protected_branches.html) in order for the CI/CD build to access the protected variables.

## Node project configuration

GitLab CI supports [Pipelines](https://docs.gitlab.com/ee/ci/pipelines.html) allowing to test on multiple Node versions and publishing a release only when all test pass.

**Note**: The publish pipeline must run a [Node >= 8.16 version](../support/FAQ.md#why-does-semantic-release-require-node-version--816).

### `.gitlab-ci.yml` configuration for Node projects

This example is a minimal configuration for **semantic-release** with a build running Node 6 and 8. See [GitLab CI - Configuration of your jobs with .gitlab-ci.yml](https://docs.gitlab.com/ee/ci/yaml/README.html) for additional configuration options.

**Note**: The`semantic-release` execution command varies depending if you are using a [local](../usage/installation.md#local-installation) or [global](../usage/installation.md#global-installation) **semantic-release** installation.

```yaml
# The release pipeline will run only if all jobs in the test pipeline are successful
stages:
    - test
    - release

before_script:
  - npm install

node:6:
  image: node:6
  stage: test
  script:
    - npm test

node:8:
  image: node:8
  stage: test
  script:
    - npm test

publish:
  image: node:8
  stage: release
  script:
    - npx semantic-release
```

### `package.json` configuration

A `package.json` is required only for [local](../usage/installation.md#local-installation) **semantic-release** installation.

```json
{
  "devDependencies": {
    "semantic-release": "^15.0.0"
  }
}
```

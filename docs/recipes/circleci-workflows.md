# Using semantic-release with [CircleCI 2.0 workflows](https://circleci.com/docs/2.0/workflows)

## Environment variables

The [Authentication](../usage/ci-configuration.md#authentication) environment variables can be configured in [CircleCi Project Settings](https://circleci.com/docs/2.0/env-vars/#adding-environment-variables-in-the-app)..

Alternatively, the default `NPM_TOKEN` and `GH_TOKEN` can be easily [setup with semantic-release-cli](../usage/ci-configuration.md#automatic-setup-with-semantic-release-cli).

## Multiple Node jobs configuration

### `.circleci/config.yml` configuration for multiple Node jobs

This example is a minimal configuration for **semantic-release** with a build running Node 6 and 8. See [CircleCI documentation](https://circleci.com/docs/2.0) for additional configuration options.

This example create the workflows `test_node_4`, `test_node_6`, `test_node_8` and `release`. The release workflows will [run `semantic-release` only after the all the `test_node_*` are successful](../usage/ci-configuration.md#run-semantic-release-only-after-all-tests-succeeded).

```yaml
version: 2
jobs:
  test_node_6:
    docker:
      - image: circleci/node:6
    steps:
      # Configure your test steps here (checkout, npm install, cache management, tests etc...)

  test_node_8:
    docker:
      - image: circleci/node:8
    steps:
      # Configure your test steps here (checkout, npm install, cache management, tests etc...)

  release:
    docker:
      - image: circleci/node:8
    steps:
      - checkout
      - run: npm install
      # Run optional required steps before releasing
      # - run: npm run build-script
      - run: npx semantic-release

workflows:
  version: 2
  test_and_release:
    # Run the test jobs first, then the release only when all the test jobs are successful
    jobs:
      - test_node_6
      - test_node_8
      - release:
          requires:
            - test_node_6
            - test_node_8
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

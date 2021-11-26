# Using semantic-release with [CircleCI 2.0 workflows](https://circleci.com/docs/2.0/workflows)

## Environment variables

The [Authentication](../../usage/ci-configuration.md#authentication) environment variables can be configured in [CircleCi Project Settings](https://circleci.com/docs/2.0/env-vars/#adding-environment-variables-in-the-app)..

Alternatively, the default `NPM_TOKEN` and `GH_TOKEN` can be easily [setup with semantic-release-cli](../../usage/getting-started.md#getting-started).

## Multiple Node jobs configuration

### `.circleci/config.yml` configuration for multiple Node jobs

This example is a minimal configuration for **semantic-release** with tests running against Node 16 and 14.
See [CircleCI documentation](https://circleci.com/docs/2.0) for additional configuration options.

In this example, the [`circleci/node`](https://circleci.com/developer/orbs/orb/circleci/node) orb is imported (Which makes some node operations easier), then a `release` job is defined which will run `semantic-release`.

To run our `release` job, we have created a workflow named `test_and_release` which will run two jobs, `node/test`, which comes from the node orb and will test our application, and our release job.
Here, we are actually making use of [matrix jobs](https://circleci.com/blog/circleci-matrix-jobs/) so that our single `node/test` job will actually be executed twice, once for Node version 16, and once for version 14.
Finally, we call our release job with a `requires` parameter so that `release` will run against the latest LTS version of node, only after `node/test` has successfully tested against v14 and v16.

```yaml
version: 2.1
orbs:
  node: circleci/node@4.5
jobs:
  release:
    executor: node/default
    steps:
      - checkout
      - node/install
          lts: true
      - node/install-packages # Install and automatically cache packages
      # Run optional required steps before releasing
      # - run: npm run build-script
      - run: npx semantic-release

workflows:
  test_and_release:
    # Run the test jobs first, then the release only when all the test jobs are successful
    jobs:
      - node/test:
          matrix:
            parameters:
              version:
                - 16.1.0
                - 14.17.0
      - release:
          requires:
            - node/test
```

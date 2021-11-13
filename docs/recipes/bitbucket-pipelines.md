# Using semantic-release with [Bitbucket-Pipelines](https://de.atlassian.com/software/bitbucket/features/pipelines)

## Environment variables

The [Authentication](../usage/ci-configuration.md#authentication) environment variables can be configured in [Pipelines Repository Settings](https://confluence.atlassian.com/bitbucket/variables-in-pipelines-794502608.html)

## Node project configuration

[Bitbucket Pipelines](https://confluence.atlassian.com/bitbucket/use-docker-images-as-build-environments-in-bitbucket-pipelines-792298897.html) can be configured to run any container from Dockerhub or private registries (such as AWS or GCP)

**Note**: The publish pipeline must run on [Node version >= 10.18](../support/FAQ.md#why-does-semantic-release-require-node-version--1018).

The following examples use the tag `lts` as default, but you can choose a more specific image if you wish to, for instance using a smaller image based on Alpine Linux, or use a specific fixed version if you worry about handle security vulnerabilities of the image itself.

You can see the list of available tags on the [public Dockerhub registry](https://hub.docker.com/_/node?tab=tags)

### 'semantic-release' installation

Install all the required plugins (including the generic `@semantic-release/git` plugin)

```bash
npm i -D @semantic-release/changelog @semantic-release/commit-analyzer @semantic-release/git @semantic-release/npm @semantic-release/release-notes-generator semantic-release
```

### 'semantic-release' configuration

Make sure you configure your package.json file with the required plugins.
A sample configuration may look like this.

```json
"devDependencies": {
  ...
},
"release": {
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/changelog",
    "@semantic-release/git"
  ]
}
```

### `bitbucket-pipelines.yml` configuration

You need to allow 2 things for this workflow to work with Bitbucket:
- authorize the pipeline to [push back to the repository](https://support.atlassian.com/bitbucket-cloud/docs/push-back-to-your-repository/): it should work seamlessly by default if your repository uses the HTTPS origin. If you use the SSH origin for any reason, allow access with your pipeline SSH keys
- authorize the pipeline to publish to npm (you will need a read+write key from npmjs.com)

1. Make sure you have the required environment variables like NPM_TOKEN and/or NPM_REGISTRY_URL set up correctly in the repository's pipelines' settings from bitbucket's UI.
2. create a `bitbucket-pipelines.yml` file in the root directory of the repository with the following.

```yaml
# bitbucket-pipelines.yml
# You can use any image & tag, just remember that node >= 10.18 is required for semantic-release
# If your packages are compatible, you can for instance use the smaller "node:lts-alpine"
# https://hub.docker.com/_/node?tab=tags
image: node:lts

pipelines:
  branches:
    master:
      - step:
          caches:
            - node
          script:
            # If you use another registry, just replace registry.npmjs.com by your registry domain, or set it as a variable
            # - npm config set //${NPM_REGISTRY_URL:-registry.npmjs.org}/:_authToken $NPM_TOKEN
            - npm config set //registry.npmjs.org/:_authToken $NPM_TOKEN
            # https://docs.npmjs.com/cli/ci.html
            - npm ci
            # Optional: run tests if you have any
            # https://support.atlassian.com/bitbucket-cloud/docs/test-reporting-in-pipelines/
            # - npm run test
            - npx semantic-release
```

## Customise the workflow

The example above is configured to publish when changes are pushed only to the master branch.

You can [configure that workflow](https://support.atlassian.com/bitbucket-cloud/docs/configure-bitbucket-pipelinesyml/) to your wishes, adding steps to test and/or audit your code.

You can also pass different CLI arguments to semantic-releases in certain cases, for instance if you wish to prepare a `next` version of your package, or if you need to maintain older major versions in parallel, or even run steps manually for instance if you want to deploy an pre-release from a branch.

### If you use yarn

The publication process works also fine with yarn, however you may have issues setting some configuration settings with yarn:
- https://github.com/yarnpkg/yarn/issues/4862
- https://github.com/yarnpkg/yarn/issues/8338

You can still use npm to set the configuration, yarn will read its values without any issue:

```yaml
# bitbucket-pipelines.yml
# You can use any image & tag, just remember that node >= 10.18 is required for semantic-release
# If your packages are compatible, you can for instance use the smaller "node:lts-alpine"
# https://hub.docker.com/_/node?tab=tags
image: node:lts

pipelines:
  branches:
    master:
      - step:
          caches:
            - node
          script:
            # Set the config using npm
            - npm config set //registry.npmjs.org/:_authToken $NPM_TOKEN
            # Then use yarn as usual
            - yarn install --frozen-lockfile
            - yarn semantic-release
```

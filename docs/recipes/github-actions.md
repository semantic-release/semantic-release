# Using semantic-release with [GitHub Actions](https://help.github.com/en/categories/automating-your-workflow-with-github-actions)

## Environment variables

The [Authentication](../usage/ci-configuration.md#authentication) environment variables can be configured with [Secret variables](https://help.github.com/en/articles/virtual-environments-for-github-actions#creating-and-using-secrets-encrypted-variables).

## Node project configuration

[GitHub Actions](https://github.com/features/actions) supports [Workflows](https://help.github.com/en/articles/configuring-workflows) allowing to test on multiple Node versions and publishing a release only when all test pass.

**Note**: The publish pipeline must run a [Node >= 8 version](../support/FAQ.md#why-does-semantic-release-require-node-version--83).

### `.github/workflows/release.yml` configuration for Node projects

This example is a minimal configuration for [`semantic-release`](https://github.com/semantic-release/semantic-release) with a build running Node 12 when receives a new commit at `master` branch. See [Configuring a workflow](https://help.github.com/en/articles/configuring-a-workflow) for additional configuration options.

```yaml
name: Release
on:
  push:
    branches:
      - master
jobs:
  install:
    name: "Generate release"
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@v1
      - uses: actions/setup-node@master
        with:
          node-version: '12.4.0'
      - name: Install
        run: npm ci
      - name: Generate release
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

### `package.json` configuration

A `package.json` is required only for [local](../usage/installation.md#local-installation) **semantic-release** installation.

```json
{
   "release":{
      "plugins":[
         "@semantic-release/commit-analyzer",
         "@semantic-release/github",
         "@semantic-release/npm",
         "@semantic-release/release-notes-generator"
      ]
   },
   "devDependencies":{
      "semantic-release":"^15.13.18"
   }
}
```

## Pushing `package.json` changes to `master` branch

If you want to keep your `package.json` updated in your code versioning with your released version you could use [`@semantic-release/git`](https://github.com/semantic-release/git) plugin. To use it you'll need to generate a `GH_TOKEN` with [permission to push changes to `master` branch](https://help.github.com/en/articles/enabling-branch-restrictions).

## Trigger semantic-release on demand

There is a way to trigger semantic-relase on demand, we can just use [`repository_dispatch`](https://help.github.com/en/articles/events-that-trigger-workflows#external-events-repository_dispatch) to have control when you want to generate a release only making a HTTP request, e.g.:

```yaml
name: Release
on: [repository_dispatch]
jobs:
# ...
```

So just call (with your personal `GH_TOKEN` or from a generic/ci user):

```
$ curl -v -H "Accept: application/vnd.github.everest-preview+json" -H "Authorization: token ${GH_TOKEN}" https://api.github.com/repos/[org-name-or-username]/[repository]/dispatches -d '{ "event_type": "any" }'
```

And `Release` workflow will be triggered.

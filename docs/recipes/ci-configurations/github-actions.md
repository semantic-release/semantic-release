# Using semantic-release with [GitHub Actions](https://help.github.com/en/categories/automating-your-workflow-with-github-actions)

## Environment variables

The [Authentication](../../usage/ci-configuration.md#authentication) environment variables can be configured with [Secret Variables](https://docs.github.com/en/actions/reference/encrypted-secrets).

In this example a publish type [`NPM_TOKEN`](https://docs.npmjs.com/creating-and-viewing-authentication-tokens) is required to publish a package to the npm registry. GitHub Actions [automatically populate](https://docs.github.com/en/actions/security-guides/automatic-token-authentication) a [`GITHUB_TOKEN`](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line) environment variable which can be used in Workflows.

## npm provenance

Since GitHub Actions is a [supported provider](https://docs.npmjs.com/generating-provenance-statements#provenance-limitations) for [npm provenance](https://docs.npmjs.com/generating-provenance-statements), it is recommended to enable this to increase supply-chain security for your npm packages.
Find more detail about configuring npm to publish with provenance through semantic-release [in the documentation for our npm plugin](https://github.com/semantic-release/npm#npm-provenance).

## Node project configuration

[GitHub Actions](https://github.com/features/actions) support [Workflows](https://help.github.com/en/articles/configuring-workflows), allowing to run tests on multiple Node versions and publish a release only when all test pass.

**Note**: The publish pipeline must run on a [Node version that meets our version requirement](../../support/node-version.md).

### `.github/workflows/release.yml` configuration for Node projects

The following is a minimal configuration for [`semantic-release`](https://github.com/semantic-release/semantic-release) with a build running on the latest LTS version of Node when a new commit is pushed to a `master/main` branch.
See [Configuring a Workflow](https://help.github.com/en/articles/configuring-a-workflow) for additional configuration options.

```yaml
name: Release
on:
  push:
    branches:
      - master # or main

permissions:
  contents: read # for checkout

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write # to be able to publish a GitHub release
      issues: write # to be able to comment on released issues
      pull-requests: write # to be able to comment on released pull requests
      id-token: write # to enable use of OIDC for npm provenance
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "lts/*"
      - name: Install dependencies
        run: npm clean-install
      - name: Verify the integrity of provenance attestations and registry signatures for installed dependencies
        run: npm audit signatures
      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

## Pushing `package.json` changes to your repository

If you choose to commit changes to your `package.json` [against our recommendation](../../support/FAQ.md#making-commits-during-the-release-process-adds-significant-complexity), the [`@semantic-release/git`](https://github.com/semantic-release/git) plugin can be used.

**Note**: Automatically populated `GITHUB_TOKEN` cannot be used if branch protection is enabled for the target branch.
It is **not** advised to mitigate this limitation by overriding an automatically populated `GITHUB_TOKEN` variable with a [Personal Access Tokens](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line), as it poses a security risk.
Since Secret Variables are available for Workflows triggered by any branch, it becomes a potential vector of attack, where a Workflow triggered from a non-protected branch can expose and use a token with elevated permissions, yielding branch protection insignificant.
One can use Personal Access Tokens in trusted environments, where all developers should have the ability to perform administrative actions in the given repository and branch protection is enabled solely for convenience purposes, to remind about required reviews or CI checks.

If the risk is acceptable, some extra configuration is needed. The [actions/checkout `persist-credentials`](https://github.com/marketplace/actions/checkout#usage) option needs to be `false`, otherwise the generated `GITHUB_TOKEN` will interfere with the custom one. Example:

```yaml
- name: Checkout
  uses: actions/checkout@v2
  with:
    fetch-depth: 0
    persist-credentials: false # <--- this
```

## Trigger semantic-release on demand

### Using GUI:

You can use [Manual Triggers](https://github.blog/changelog/2020-07-06-github-actions-manual-triggers-with-workflow_dispatch/) for GitHub Actions.

### Using HTTP:

Use [`repository_dispatch`](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#repository_dispatch) event to have control on when to generate a release by making an HTTP request, e.g.:

```yaml
name: Release
on:
  repository_dispatch:
    types: [semantic-release]
jobs:
# ...
```

To trigger a release, call (with a [Personal Access Tokens](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) stored in `GITHUB_TOKEN` environment variable):

```
$ curl -v -H "Accept: application/vnd.github.everest-preview+json" -H "Authorization: token ${GITHUB_TOKEN}" https://api.github.com/repos/[org-name-or-username]/[repository]/dispatches -d '{ "event_type": "semantic-release" }'
```

### Using 3rd party apps:

If you'd like to use a GitHub app to manage this instead of creating a personal access token, you could consider using a project like:

- [Actions Panel](https://www.actionspanel.app/) - A declaratively configured way for triggering GitHub Actions
- [Action Button](https://github-action-button.web.app/#details) - A simple badge based mechanism for triggering GitHub Actions

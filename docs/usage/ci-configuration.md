# CI configuration

## Run `semantic-release` only after all tests succeeded

The `semantic-release` command must be executed only after all the tests in the CI build pass. If the build runs multiple jobs (for example to test on multiple Operating Systems or Node versions) the CI has to be configured to guarantee that the `semantic-release` command is executed only after all jobs are successful. This can be achieved with [Travis Build Stages](https://docs.travis-ci.com/user/build-stages), [CircleCI Workflows](https://circleci.com/docs/2.0/workflows), [Codeship Deployment Pipelines](https://documentation.codeship.com/basic/builds-and-configuration/deployment-pipelines), [GitLab Pipelines](https://docs.gitlab.com/ee/ci/pipelines.html#introduction-to-pipelines-and-jobs), [Wercker Workflows](http://devcenter.wercker.com/docs/workflows), [GoCD Pipelines](https://docs.gocd.org/current/introduction/concepts_in_go.html#pipeline) or specific tools like [`travis-deploy-once`](https://github.com/semantic-release/travis-deploy-once).

See [CI configuration recipes](../recipes/README.md#ci-configurations) for more details.

## Authentication

Most **semantic-release** [plugins](plugins.md) require to set up authentication in order to publish to your package manager's registry or to access your project's Git hosted service. The authentication token/credentials have to be made available in the CI serice via environment variables.

See each plugin documentation for the environment variable to set up.

The default [npm](https://github.com/semantic-release/npm#environment-variables) and [github](https://github.com/semantic-release/github#environment-variables) plugins require the following environment variables:

| Variable    | Description                                                                                                                                                                                                                                                                                                               |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `NPM_TOKEN` | npm token created via [npm token create](https://docs.npmjs.com/getting-started/working_with_tokens#how-to-create-new-tokens).<br/>**Note**: Only the `auth-only` [level of npm two-factor authentication](https://docs.npmjs.com/getting-started/using-two-factor-authentication#levels-of-authentication) is supported. |
| `GH_TOKEN`  | GitHub authentication token.<br/>**Note**: Only the [personal token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line) authentication is supported.                                                                                                                                 |

See [CI configuration recipes](../recipes/README.md#ci-configurations) for more details on how to configure environment variables in your CI service.

## Automatic setup with `semantic-release-cli`

[`semantic-release-cli`](https://github.com/semantic-release/cli) allow to easily [install](installation.md) **semantic-release** in your Node project and set up the CI configuration:

```bash
npm install -g semantic-release-cli

cd your-module
semantic-release-cli setup
```

![dialogue](media/semantic-release-cli.png)

See the [semantic-release-cli](https://github.com/semantic-release/cli#what-it-does) documentation for more details.

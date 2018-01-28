# CI configuration

## Run `semantic-release` only after all tests succeeded

The `semantic-release` command must be executed only after all the tests in the CI build pass. If the build runs multiple jobs (for example to test on multiple Operating Systems or Node versions) the CI has to be configured to guarantee that the `semantic-release` command is executed only after all jobs are successful. This can be achieved with [Travis Build Stages](https://docs.travis-ci.com/user/build-stages), [CircleCI Workflows](https://circleci.com/docs/2.0/workflows), [Codeship Deployment Pipelines](https://documentation.codeship.com/basic/builds-and-configuration/deployment-pipelines), [GitLab Pipelines](https://docs.gitlab.com/ee/ci/pipelines.html#introduction-to-pipelines-and-jobs), [Wercker Workflows](http://devcenter.wercker.com/docs/workflows), [GoCD Pipelines](https://docs.gocd.org/current/introduction/concepts_in_go.html#pipeline) or specific tools like [`travis-deploy-once`](https://github.com/semantic-release/travis-deploy-once).

See [CI configuration recipes](../recipes/README.md#ci-configurations) for more details.

## Authentication

**semantic-release** requires push access to the project Git repository in order to create [Git tags](https://git-scm.com/book/en/v2/Git-Basics-Tagging). The Git authentication can be set with one of the following environment variables:

| Variable                     | Description                                                                                                                   |
|------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| `GH_TOKEN` or `GITHUB_TOKEN` | A GitHub [personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line).     |
| `GL_TOKEN` or `GITLAB_TOKEN` | A GitLab [personal access token](https://docs.gitlab.com/ce/user/profile/personal_access_tokens.html).                        |
| `GIT_CREDENTIALS`            | [URL encoded basic HTTP Authentication](https://en.wikipedia.org/wiki/Basic_access_authentication#URL_encoding) credentials). |

`GIT_CREDENTIALS` can be the Git username and password in the format `<username>:<password>` or a token for certain Git providers like [Bitbucket](https://confluence.atlassian.com/bitbucketserver/personal-access-tokens-939515499.html).

Alternatively the Git authentication can be set up via [SSH keys](../recipes/git-auth-ssh-keys.md).

Most **semantic-release** [plugins](plugins.md) require to set up authentication in order to publish to a package manager registry. The default [npm](https://github.com/semantic-release/npm#environment-variables) and [github](https://github.com/semantic-release/github#environment-variables) plugins require the following environment variables:

| Variable    | Description                                                                                                                                                                                                                                                                                                               |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `NPM_TOKEN` | npm token created via [npm token create](https://docs.npmjs.com/getting-started/working_with_tokens#how-to-create-new-tokens).<br/>**Note**: Only the `auth-only` [level of npm two-factor authentication](https://docs.npmjs.com/getting-started/using-two-factor-authentication#levels-of-authentication) is supported. |
| `GH_TOKEN`  | GitHub authentication token.<br/>**Note**: Only the [personal token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line) authentication is supported.                                                                                                                                 |

See each plugin documentation for the environment variables to set up.

The authentication token/credentials have to be made available in the CI service via environment variables.

See [CI configuration recipes](../recipes/README.md#ci-configurations) for more details on how to configure environment variables in your CI service.

## Automatic setup with `semantic-release-cli`

[`semantic-release-cli`](https://github.com/semantic-release/cli) allow to easily [install](installation.md) **semantic-release** in your Node project and set up the CI configuration:

```bash
npm install -g semantic-release-cli

cd your-module
semantic-release-cli setup
```

![dialogue](../../media/semantic-release-cli.png)

See the [semantic-release-cli](https://github.com/semantic-release/cli#what-it-does) documentation for more details.

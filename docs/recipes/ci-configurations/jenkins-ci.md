# Using semantic-release with [Jenkins CI](https://www.jenkins.io/doc/book/pipeline/)

## Environment variables

The [Authentication](../../usage/ci-configuration.md#authentication) environment variables can be configured in [Jenkins Project Settings](https://www.jenkins.io/doc/pipeline/tour/environment/)..

Alternatively, the default `NPM_TOKEN` and `GH_TOKEN` can be easily [setup with semantic-release-cli](../../usage/getting-started.md#getting-started).

## Node.js project configuration

### `Jenkinsfile (Declarative Pipeline)` configuration for a Node.js job

**Note**: The publish pipeline must run a Node version that [meets our requirement](../../support/node-version.md).

This example is a minimal configuration for **semantic-release** with a build running a version of Node labelled as "node LTS".
Since versions of Node are manually downloaded and labelled, we recommend keeping the version used for the release steps up-to-date with the latest LTS version.
See the [Jenkins documentation](https://www.jenkins.io/doc/) for additional configuration options.

```yaml
// The release stage in the pipeline will run only if the test stage in the pipeline is successful
pipeline {
    agent any
    environment {
        GH_TOKEN  = credentials('some-id')
    }
    stages {
        stage('Test') {
            steps {
                sh '''
                # Configure your test steps here (checkout, npm install, tests etc)
                npm install
                npm test
                '''
            }
        }
        stage('Release') {
            tools {
                nodejs "node LTS"
            }
            steps {
                sh '''
                # Run optional required steps before releasing
                npx semantic-release
                '''
            }
        }
    }
}
```

### `package.json` configuration for a Node job

A `package.json` is required only for [local](../../usage/installation.md#local-installation) **semantic-release** installation.

```json
{
  "devDependencies": {
    "semantic-release": "^18.0.0"
  }
}
```

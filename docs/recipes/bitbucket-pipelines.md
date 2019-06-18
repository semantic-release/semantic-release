# Using semantic-release with [Bitbucket-Pipelines](https://de.atlassian.com/software/bitbucket/features/pipelines)

## Environment variables

The [Authentication](../usage/ci-configuration.md#authentication) environment variables can be configured in [Pipelines Repository Settings](https://confluence.atlassian.com/bitbucket/variables-in-pipelines-794502608.html)


### Node.js projects configuration
First install all the required plugins
```
npm i -D @semantic-release/changelog@next @semantic-release/commit-analyzer@next @semantic-release/git@next @semantic-release/npm@next @semantic-release/release-notes-generator@next semantic-release@next
```

Make sure you configure your package.json file with the required plugins.
A sample configuration may look like this.

```
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
},
  ```

### `bitbucket-pipelines.yml` Configuration
1. Make sure you have the required environment variables like NPM_TOKEN and/or NPM_REGISTRY_URL set up correctly in the repository's pipelines' settings from bitbucket's UI.
2. create a `bitbucket-pipelines.yml` file in the root directory of the repository with the following.

```
image: node:latest

pipelines:
  default:
    - step:
        caches:
          - node
        script:
          - printf "//`node -p \"require('url').parse(process.env.NPM_REGISTRY_URL || 'https://registry.npmjs.org').host\"`/:_authToken=${NPM_TOKEN}\nregistry=${NPM_REGISTRY_URL:-https://registry.npmjs.org}\n" >> ~/.npmrc
          - npm install
          - npm test
          - npx semantic-release
```


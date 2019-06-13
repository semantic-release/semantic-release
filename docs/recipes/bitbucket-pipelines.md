This document shows how you can setup semantic-release with bitbucket's pipelines.

# Setup
First make sure you install all the required plugins
```
npm i -D @semantic-release/changelog@next @semantic-release/commit-analyzer@next @semantic-release/git@next @semantic-release/npm@next @semantic-release/release-notes-generator@next semantic-release@next
```

# Pipelines Configuration
1. Setup the necessary environment variables or SSH keys for Authentication as mentioned [here](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/ci-configuration.md#authentication) and add the required environment variables (like NPM_TOKEN and/or NPM_REGISTRY_URL) to the repository's pipelines' settings from bitbucket UI.
2. create a bitbucket-pipelines.yml in the root directory of the repository with the following.

```
image: node:latest

pipelines:
  default:
    - step:
        caches:
          - node
        script: # Modify the commands below to build your repository.
          - printf "//`node -p \"require('url').parse(process.env.NPM_REGISTRY_URL || 'https://registry.npmjs.org').host\"`/:_authToken=${NPM_TOKEN}\nregistry=${NPM_REGISTRY_URL:-https://registry.npmjs.org}\n" >> ~/.npmrc
          - npm install
          - npm test
          - npx semantic-release
```

# Package.json configuration
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

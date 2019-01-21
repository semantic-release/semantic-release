This document shows how you can setup semantic-release with bitbucket's pipelines and a private npm registry.

# Pipelines Configuration
1. (Optional) If you're using a private registry follow the steps here https://npme.npmjs.com/docs/tutorials/pipelines.html then set the environment variables NPM_REGISTRY_URL & NPM_TOKEN in the repository's pipelines' settings..
2. Add an SSH Key to pipelines settings from the repository's pipelines' settings so that it has access to the repository.
3. create a bitbucket-pipelines.yml in the root directory of the repository with the following.

```
image: node:latest

pipelines:
  default:
    - step:
        caches:
          - node
        script: # Modify the commands below to build your repository.
          # Generates a .npmrc file configured for installing private modules:
          #
          # NPM_REGISTRY_URL: the full URL of your private registry
          #                   defaults to registry.npmjs.org.
          # NPM_TOKEN: secret token for installing private modules. This
          #            this token can be found in your .npmrc, after logging in.
          - printf "//`node -p \"require('url').parse(process.env.NPM_REGISTRY_URL || 'https://registry.npmjs.org').host\"`/:_authToken=${NPM_TOKEN}\nregistry=${NPM_REGISTRY_URL:-https://registry.npmjs.org}\n" >> ~/.npmrc
          - npm install
          - npm test
          - npx semantic-release
```

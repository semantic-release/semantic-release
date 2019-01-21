This document shows how you can setup semantic-release with bitbucket's pipelines and a private npm registry.

# Package.json
Make sure you configure your package.json file with the required plugins.
A sample configuration may look like this.

```
"devDependencies": {
    "@semantic-release/changelog": "^3.0.2",
    "@semantic-release/commit-analyzer": "^6.1.0",
    "@semantic-release/git": "^7.0.7",
    "@semantic-release/npm": "^5.1.3",
    "@semantic-release/release-notes-generator": "^7.1.4",
    "semantic-release": "^15.13.2"
  },
  "release": {
    "repositoryUrl": "<SSH Repo URL>",
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/npm",
      "@semantic-release/changelog",
      "@semantic-release/git"
    ]
  }
  ```
  
# Pipelines Configuration
1. (Optional) If you're using a private registry follow the steps here https://npme.npmjs.com/docs/tutorials/pipelines.html then set the environment variables NPM_REGISTRY_URL & NPM_TOKEN in the repository's pipelines' settings from bitbucket's UI..
2. Add an SSH Key to pipelines settings from the repository's pipelines' settings in bitbucket UI so that it can access the repository.
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

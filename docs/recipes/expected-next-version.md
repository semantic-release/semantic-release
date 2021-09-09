# Getting the expected next version

There are some situations where you will need the next version prior to running semantic-release, some examples are languages that require the build number at build time. Since semantic-release is focused on releasing your built bits not building them you will need to run semantic-release twice. The following may help you setup this workflow within your solution.

## Example use case

In this example we are building a docker image that must include a file in the docker image that includes the build number. This is created by a custom semantic-release plugin call application-info. But you could use the exec plugin to accomplish a similar task of writing to a file or some other destination.

Create your standard release.config.js

```JavaScript
// release.config.js
module.exports = {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      'semantic-release-docker',
      {
        name: `my-cool-docker-app`,
      },
    ],
  ],
};
```

> this is just an example config you may need something more complex in your scenario

Create a pre-release.config.js that will be run before running semantic-release that extends your base release config overriding the the skipTag property and plugins property to only include the plugins needed in the pre-release stage.

```JavaScript
// pre-release.config.js
// npx semantic-release --extends=./pre-release.config.js

const baseReleaseConfig = require('./release.config.js');

module.exports = {
  ...baseReleaseConfig,
  skipTag: true,
  plugins: ['@semantic-release/commit-analyzer', './release-scripts/application-info'],
};
```

In your CI solution you should run `npx semantic-release --extends=./pre-release.config.js` prior to building your application to perform any tasks that are required as part of the build and to include the next version number.

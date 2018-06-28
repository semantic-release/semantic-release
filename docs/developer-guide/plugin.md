# Plugin developer guide

Note: _This page contains information about developing your own plug-ins for semantic release.
For information on using and configuring existing plugins, please see the [Plugins Documentation](https://github.com/semantic-release/semantic-release/blob/caribou/docs/usage/plugins.md)._

Semantic Release works by running through a series of [Release Steps](https://github.com/semantic-release/semantic-release#release-steps). Most of the default functionality is implemented as plugins, and you create your own plugins to have Semantic Release perform whatever steps you require.

A plugin is simply a JS function that you export. For example:

```js
const execa = require('execa');

async function prepareElmRelease(pluginConfig, context) {
  const {stdout} = await execa.shell('yes | yarn elm-package bump');
  console.log(stdout);
}

module.exports = prepareElmRelease;
```

The function can optionally execute asynchronously, by using `async / await`, by returning a promise, or by receiving a traditional callback function as the final argument passed to the function.

If your plugin runs during multiple Release Steps, you can export several functions using names that match those steps:

```js
async function verifyConditions(pluginConfig, context) {
  // ...
}

async function prepare(pluginConfig, context) {
  // ...
}

async function publish(pluginConfig, context) {
  // ...
}

module.exports = {verifyConditions, prepare, publish};
```

## Parameters

### pluginConfig

This is an object that contains the config for the specific plugin, as well as the general semantic-release config. The information available will change depending on the plugin and depending on your config.

### Context

The second function argument passed to your plugin is a context object, which contains information about the current run of semantic-release. The amount of information available in the context depends on the type of plugin you are running - plugins that run later in the build will have more information available in the context.

An example context object:

```
context: {
  options: {
    branch: "master",
    repositoryUrl: "https://github.com/cultureamp/elm-css-modules-loader.git"
  },
  logger: {
    log: function () {}, // Use this instead of console.log()
    error: function () {}, // Use this instead of console.error()
  },
  // `commits` is only available in analyzeCommits, verifyRelease, generateNotes, prepare, publish and success plugins
  commits: [{
    hash: "ad7a252ef46bc6eafd159cbf0d64c7f9bc2660d8",
    message: "Bug fix!"
  }],
  // `lastRelease` is only available in analyzeCommits, verifyRelease, generateNotes, prepare, publish and success plugins
  lastRelease: {
    type: "minor",
    gitHead: "1f04f0a282774b7f4764cfe6e680d2fd0eb6b70d",
    gitTag: "2.1.0",
    notes: "New feature!",
  },
  // `nextRelease` is only available in verifyRelease, generateNotes, prepare, publish and success plugins
  nextRelease: {
    type: "patch",
    gitHead: "ad7a252ef46bc6eafd159cbf0d64c7f9bc2660d8",
    gitTag: "2.1.1",
    notes: "Bug fix!",
  },
  // `releases` is only available in success plugins
  releases: [],
}
```

## Expected Return Types

Some plugin are expected to return specific data (either synchronously or asynchronously).

| Plugin type       | Expected return type                                                                  |
|-------------------|---------------------------------------------------------------------------------------|
| Verify Conditions | -                                                                                     |
| Analyze commits   | The release type (String: 'major', 'minor' or 'patch')                                |
| Verify release    | -                                                                                     |
| Generate notes    | Release notes (String)                                                                |
| Prepare           | -                                                                                     |
| Publish           | Release info: {name: 'NPM Release', url: 'https://url.to/specific/release/version'}   |
| Notify            | -                                                                                     |


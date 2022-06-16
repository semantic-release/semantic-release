# Plugin Developer Guide

To create a plugin for `semantic-release`, you need to decide which parts of the release lifecycle are important to that plugin. For example, it is best to always have a `verifyConditions` step because you may be receiving inputs from a user and want to make sure they exist. A plugin can abide by any of the following lifecycles:

- `verifyConditions`
- `analyzeCommits`
- `verifyRelease`
- `generateNotes`
- `addChannel`
- `prepare`
- `publish`
- `success`
- `fail`

`semantic-release` will require the plugin via `node` and look through the required object for methods named like the lifecycles stated above. For example, if your plugin only had a `verifyConditions` and `success` step, the `main` file for your object would need to `export` an object with `verifyConditions` and `success` functions.

In addition to the lifecycle methods, each lifecycle is passed two objects:

1. `pluginConfig` - an object containing the options that a user may pass in via their `release.config.js` file (or similar)
2. `context` - provided by `semantic-release` for access to things like `env` variables set on the running process.

For each lifecycle you create, you will want to ensure it can accept `pluginConfig` and `context` as parameters.

## Creating a Plugin Project

It is recommended that you generate a new project with `yarn init`. This will provide you with a basic node project to get started with. From there, create an `index.js` file, and make sure it is specified as the `main` in the `package.json`. We will use this file to orchestrate the lifecycle methods later on.

Next, create a `src` or `lib` folder in the root of the project. This is where we will store our logic and code for how our lifecycle methods work. Finally, create a `test` folder so you can write tests related to your logic.

We recommend you setup a linting system to ensure good javascript practices are enforced. ESLint is usually the system of choice, and the configuration can be whatever you or your team fancies.

## Exposing Lifecycle Methods

In your `index.js` file, you can start by writing the following code

```javascript
const verify = require('./src/verify');

let verified;

/**
 * Called by semantic-release during the verification step
 * @param {*} pluginConfig The semantic-release plugin config
 * @param {*} context The context provided by semantic-release
 */
async function verifyConditions(pluginConfig, context) {
  await verify(pluginConfig, context);
  verified = true;
}

module.exports = { verifyConditions };
```

Then, in your `src` folder, create a file called `verify.js` and add the following

```javascript
const AggregateError = require('aggregate-error');

/**
 * A method to verify that the user has given us a slack webhook url to post to
 */
module.exports = async (pluginConfig, context) => {
  const { logger } = context;
  const errors = [];

  // Throw any errors we accumulated during the validation
  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
};
```

As of right now, this code won't do anything. However, if you were to run this plugin via `semantic-release`, it would run when the `verify` step occurred.

Following this structure, you can create different steps and checks to run through out the release process.

## Supporting Options

Let's say we want to verify that an `option` is passed. An `option` is a configuration object that is specific to your plugin. For example, the user may set an `option` in their release config like:

```js
{
    prepare: {
        path: "@semantic-release/my-special-plugin"
        message: "My cool release message"
    }
}
```

This `message` option will be passed to the `pluginConfig` object mentioned earlier. We can use the validation method we created to verify this option exists so we can perform logic based on that knowledge. In our `verify` file, we can add the following:

```js
const { message } = pluginConfig;

if (message.length) {
    //...
}
```

## Context

### Common context keys

* `stdout`
* `stderr`
* `logger`

### Context object keys by lifecycle

#### verifyConditions

Initially the context object contains the following keys (`verifyConditions` lifecycle):
* `cwd`
  * Current working directory
* `env`
  * Environment variables
* `envCi`
  * Information about CI environment
  * Contains (at least) the following keys:
    * `isCi`
      * Boolean, true if the environment is a CI environment
    * `commit`
      * Commit hash
    * `branch`
      * Current branch
* `options`
  * Options passed to `semantic-release` via CLI, configuration files etc.
* `branch`
  * Information on the current branch
  * Object keys:
    * `channel`
    * `tags`
    * `type`
    * `name`
    * `range`
    * `accept`
    * `main`
* `branches`
  * Information on branches
  * List of branch objects (see above)

#### analyzeCommits

Compared to the verifyConditions, `analyzeCommits` lifecycle context has keys

* `commits` (List)
  * List of commits taken into account when determining the new version.
  * Keys:
    * `commit` (Object)
      * Keys:
        * `long` (String, Commit hash)
        * `short` (String, Commit hash)
    * `tree` (Object)
      * Keys:
        * `long` (String, Commit hash)
        * `short` (String, Commit hash)
    * `author` (Object)
      * Keys:
        * `name` (String)
        * `email` (String)
        * `date` (String, ISO 8601 timestamp)
    * `committer` (Object)
      * Keys:
        * `name` (String)
        * `email` (String)
        * `date` (String, ISO 8601 timestamp)
    * `subject` (String, Commit message subject)
    * `body` (String, Commit message body)
    * `hash` (String, Commit hash)
    * `committerDate` (String, ISO 8601 timestamp)
    * `message` (String)
    * `gitTags` (String, List of git tags)
* `releases` (List)
* `lastRelease` (Object)
  * Keys
    * `version` (String)
    * `gitTag` (String)
    * `channels` (List)
    * `gitHead` (String, Commit hash)
    * `name` (String)

#### verifyRelease

Additional keys:

* `nextRelease` (Object)
  * `type` (String)
  * `channel` (String)
  * `gitHead` (String, Git hash)
  * `version` (String, version without `v`)
  * `gitTag` (String, version with `v`)
  * `name` (String)
    
#### generateNotes

No new content in the context.

#### addChannel

*This is run only if there are releases that have been merged from a higher branch but not added on the channel of the current branch.*

Context content is similar to lifecycle `verifyRelease`.

#### prepare

Only change is that `generateNotes` has populated `nextRelease.notes`.

#### publish

No new content in the context.

#### success

Lifecycles `success` and `fail` are mutually exclusive, only one of them will be run.

Additional keys:

* `releases`
  * Populated by `publish` lifecycle

#### fail

Lifecycles `success` and `fail` are mutually exclusive, only one of them will be run.

Additional keys:

* `errors`

### Supporting Environment Variables

Similar to `options`, environment variables exist to allow users to pass tokens and set special URLs. These are set on the `context` object instead of the `pluginConfig` object. Let's say we wanted to check for `GITHUB_TOKEN` in the environment because we want to post to GitHub on the user's behalf. To do this, we can add the following to our `verify` command:

```js
const { env } = context;

if (env.GITHUB_TOKEN) {
  //...
}
```
## Logger
Use `context.logger` to provide debug logging in the plugin.

```js
const { logger } = context;

logger.log('Some message from plugin.'). 
```

The above usage yields the following where `PLUGIN_PACKAGE_NAME` is automatically inferred.

```
[3:24:04 PM] [semantic-release] [PLUGIN_PACKAGE_NAME] › ℹ  Some message from plugin.
```

## Execution order

For the lifecycles, the list at the top of the readme contains the order. If there are multiple plugins for the same lifecycle, then the order of the plugins determines the order in which they are executed.

## Handling errors

In order to be able to detect and handle errors properly, the errors thrown from the must be of type [SemanticReleaseError](https://github.com/semantic-release/error) or extend it as described in the package readme. This way the errors are handled properly and plugins using the `fail` lifecycle receive the errors correctly. For any other types of errors the internal error handling does nothing, lets them through up until the final catch and does not call any `fail` plugins.

## Advanced

Knowledge that might be useful for plugin developers.

### Multiple analyzeCommits plugins

While it may be trivial that multiple analyzeCommits (or any lifecycle plugins) can be defined, it is not that self-evident that the plugins executed AFTER the first one (for example, the default one: `commit-analyzer`) can change the result. This way it is possible to create more advanced rules or situations, e.g. if none of the commits would result in new release, then a default can be defined.

The commit must be a known release type, for example the commit-analyzer has the following default types:
* major
* premajor
* minor
* preminor
* patch
* prepatch
* prerelease

If the analyzeCommits-lifecycle plugin does not return anything, then the earlier result is used, but if it returns a supported string value, then that overrides the previous result.

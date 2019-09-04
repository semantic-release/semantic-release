# Plugin Developer Guide

To create a plugin for `semantic-release`, you need to decide which parts of the release lifecycle are important to that plugin. For example, it is best to always have a `verify` step because you may be receiving inputs from a user and want to make sure they exist. A plugin can abide by any of the following lifecycles:

- `verify`
- `prepare`
- `publish`
- `success`
- `fail`

`semantic-release` will require the plugin via `node` and look through the required object for methods named like the lifecyles stated above. For example, if your plugin only had a `verify` and `success` step, the `main` file for your object would need to `export` an object with `verify` and `success` functions.

In addition to the lifecycle methods, each lifecyle is passed two objects:

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
const verifyConditions = require('./src/verify');

let verified;

/**
 * Called by semantic-release during the verification step
 * @param {*} pluginConfig The semantic-release plugin config
 * @param {*} context The context provided by semantic-release
 */
async function verify(pluginConfig, context) {
  await verifyConditions(pluginConfig, context);
  verified = true;
}

module.exports = { verify };
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

## Supporting Environment Variables

Similar to `options`, environment variables exist to allow users to pass tokens and set special URLs. These are set on the `context` object instead of the `pluginConfig` object. Let's say we wanted to check for `GITHUB_TOKEN` in the environment because we want to post to GitHub on the user's behalf. To do this, we can add the following to our `verify` command:

```js
const { env } = context;

if (env.GITHUB_TOKEN) {
    //...
}
```
# Installation

## Local installation

For [Node modules projects](https://docs.npmjs.com/getting-started/creating-node-modules) we recommend installing **semantic-release** locally and running the `semantic-release` command with [npx](https://www.npmjs.com/package/npx):

```bash
$ npm install --save-dev semantic-release
```

Then in the CI environment:

```bash
$ npx semantic-release
```

> **Note:** `npx` is a tool bundled with `npm@>=5.2.0`. It is used to conveniently find the semantic-release binary and to execute it. See [What is npx](../05-support/FAQ.md#what-is-npx) for more details.

## Global installation

> **Note:** Global installation is no longer recommended. Please use local installation and `npx` instead.


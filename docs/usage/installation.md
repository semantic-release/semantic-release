# Installation

## Local installation

For [Node modules projects](https://docs.npmjs.com/getting-started/creating-node-modules) we recommend to install **semantic-release** locally and to run the `semantic-release` command with [npx](https://www.npmjs.com/package/npx):

```bash
$ npm install --save-dev semantic-release
```

Then in the CI environment:

```bash
$ npx semantic-release
```

**Note:**: `npx` is a tool bundled with `npm@>=5.2.0`. It is used to conveniently find the semantic-release binary and to execute it. See [What is npx](../support/FAQ.md#what-is-npx) for more details.

## Global installation

For other type of projects we recommend to install **semantic-release** directly in the CI environment, also with [npx](https://www.npmjs.com/package/npx):

```bash
$ npx semantic-release
```

**Note:**: For a global installation, it's recommended to specify the major **semantic-release** version to install (for example with with `npx semantic-release@12`, or `npm install -g semantic-release@12`). This way your build will not automatically use the next major **semantic-release** release that could possibly break your build. You will have to upgrade manually when a new major version is released.

**Note:**: `npx` is a tool bundled with `npm@>=5.2.0`. It is used to conveniently install the semantic-release binary and to execute it. See [What is npx](../support/FAQ.md#what-is-npx) for more details.

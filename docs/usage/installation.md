# Installation

## Local installation

For [Node modules projects](https://docs.npmjs.com/getting-started/creating-node-modules) we recommend to install **semantic-release** locally and to run the `semantic-release` command with a [npm script](https://docs.npmjs.com/misc/scripts):

```bash
$ npm install --save-dev semantic-release
```

In your `package.json`:

```json
"scripts": {
  "semantic-release": "semantic-release"
}
```

Then in the CI environment:

```bash
$ npm run semantic-release
```

## Global installation

For other type of projects we recommend to install **semantic-release** globally directly in the CI environment:

```bash
$ npm install -g semantic-release
$ semantic-release
```
**Note:**: For a global installation, it's recommended to specify the major **semantic-release** version to install (for example with with `npm install -g semantic-release@12`). This way your build will not automatically use the next major **semantic-release** release that could possibly break your build. You will have to upgrade manually when a new major version is released.

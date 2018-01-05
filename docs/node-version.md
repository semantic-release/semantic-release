# Node version requirement

semantic-release is written using the latest [ECMAScript 2017](https://www.ecma-international.org/publications/standards/Ecma-262.htm) features, without transpilation which requires **requires Node version 8 or higher**.

semantic-release is meant to be used in a CI environment as a development support tool, not as a production dependency. Therefore the only constraint is to run the `semantic-release` in a CI environment providing Node 8 or higher.

See our [Node Support Policy](../README.md#node-support-policy) for our long-term promise regarding Node version support.

## Recommended solution

### Run at least one CI job with Node >= 8

The recommended approach is to run the `semantic-release` command from a CI job running on Node 8 or higher. This can either be a job used by your project to test on Node 8 or a dedicated job for the release steps.

See [CI configuration](../README.md#ci-configuration) and [CI configuration recipes](recipes/README.md#ci-configurations) for more details.

## Alternative solutions

### Use `npx`

[`npx`](https://github.com/zkat/npx) is a CLI to execute npm binaries. It is bundled with [npm](https://www.npmjs.com/package/npm) >= 5.4, or can be installed via `npm install -g npx`.

`npx` can be used to download the [Node 8 package published on npm](https://www.npmjs.com/package/node) and use it to execute the `semantic-release` command.

If you are using a [local](../README.md#local-installation) semantic-release installation:

```bash
$ npm install -g npx && npx -p node@8 -c "npm run semantic-release"
```

If you are using a [global](../README.md#global-installation) semantic-release installation:

```bash
# For global semantic-release install
$ npm install -g semantic-release npx && npx -p node@8 -c "semantic-release"
```

### Use `nvm`

If your CI environment provides [nvm](https://github.com/creationix/nvm) you can use it to switch to Node 8 before running the `semantic-release` command.

If you are using a [local](../README.md#local-installation) semantic-release installation:

```bash
$ nvm install 8 && npm run semantic-release
```

If you are using a [global](../README.md#global-installation) semantic-release installation:

```bash
$ nvm install 8 && npm install -g semantic-release && semantic-release
```

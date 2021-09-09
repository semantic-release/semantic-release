# Node version requirement

**semantic-release** is written using the latest [ECMAScript 2017](https://www.ecma-international.org/publications/standards/Ecma-262.htm) features, without transpilation which **requires Node version 10.19 or higher**.

**semantic-release** is meant to be used in a CI environment as a development support tool, not as a production dependency. Therefore, the only constraint is to run the `semantic-release` in a CI environment providing Node 10.19 or higher.

See our [Node Support Policy](node-support-policy.md) for our long-term promise regarding Node version support.

## Recommended solution

### Run at least one CI job with Node >= 10.19

The recommended approach is to run the `semantic-release` command from a CI job running on Node 10.19 or higher. This can either be a job used by your project to test on Node >= 10.19 or a dedicated job for the release steps.

See [CI configuration](../usage/ci-configuration.md) and [CI configuration recipes](../recipes/README.md#ci-configurations) for more details.

## Alternative solutions

### Use `npx`

`npx` is included with npm >= 5.2 and can be used to download the latest [Node 10 package published on npm](https://www.npmjs.com/package/node). Use it to execute the `semantic-release` command.

```bash
$ npx -p node@10 -c "npx semantic-release"
```

**Note:**: See [What is npx](./FAQ.md#what-is-npx) for more details.

### Use `nvm`

If your CI environment provides [nvm](https://github.com/creationix/nvm) you can use it to switch to Node 10.19 before running the `semantic-release` command.

```bash
$ nvm install 10.19 && npx semantic-release
```

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

**Note:** `npx` is a tool bundled with `npm@>=5.2.0`. It is used to conveniently find the semantic-release binary and to execute it. See [What is npx](../support/FAQ.md#what-is-npx) for more details.

## Global installation

For other type of projects we recommend installing **semantic-release** directly in the CI environment, also with [npx](https://www.npmjs.com/package/npx):

```bash
$ npx semantic-release
```

### Notes

1. For a global installation, it's recommended to specify the major **semantic-release** version to install (for example with `npx semantic-release@18`).
   This way your build will not automatically use the next major **semantic-release** release that could possibly break your build.
   You will have to upgrade manually when a new major version is released.
2. Specifying an exact version will make your releases even more deterministic, but requires regular maintenance to stay up to date when new versions of **semantic-release** become available.
   In projects using [Renovate](https://docs.renovatebot.com/), a [regex manager](https://docs.renovatebot.com/modules/manager/regex/) can be defined to recommend version updates when new **semantic-release** versions are published:
   ```json
   {
     "regexManagers": [
       {
         "description": "Update semantic-release version used by npx",
         "fileMatch": ["^\\.github/workflows/[^/]+\\.ya?ml$"],
         "matchStrings": ["\\srun: npx semantic-release@(?<currentValue>.*?)\\s"],
         "datasourceTemplate": "npm",
         "depNameTemplate": "semantic-release"
       }
     ]
   }
   ```
3. `npx` is a tool bundled with `npm@>=5.2.0`. It is used to conveniently install the semantic-release binary and to execute it.
   See [What is npx](../support/FAQ.md#what-is-npx) for more details.

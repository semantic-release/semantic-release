# Installation

## Local installation

For [Node modules projects](https://docs.npmjs.com/getting-started/creating-node-modules) we recommend installing **semantic-release** locally and running the `semantic-release` command with [npx](https://www.npmjs.com/package/npx):

```bash
npm install --save-dev semantic-release
```

Then in the CI environment:

```bash
npx semantic-release
```

**Note:** `npx` is a tool bundled with `npm@>=5.2.0`. It is used to conveniently find the semantic-release binary and to execute it. See [What is npx](../support/FAQ.md#what-is-npx) for more details.

## Global installation

For other type of projects we recommend installing **semantic-release** directly in the CI environment, also with [npx](https://www.npmjs.com/package/npx):

```bash
npx semantic-release
```

### Notes

1. If you've globally installed **semantic-release** then we recommend that you set the major **semantic-release** version to install.
   For example, by using `npx semantic-release@18`.
   This way you control which major version of **semantic-release** is used by your build, and thus avoid breaking the build when there's a new major version of **semantic-release**.
   This also means you, or a bot, must upgrade **semantic-release** when a new major version is released.
2. Pinning **semantic-release** to an exact version makes your releases even more deterministic.
   But pinning also means you, or a bot, must update to newer versions of **semantic-release** more often.
3. You can use [Renovate's regex manager](https://docs.renovatebot.com/modules/manager/regex/) to get automatic updates for **semantic-release** in either of the above scenarios.
   Put this in your Renovate configuration file:
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
4. `npx` is a tool bundled with `npm@>=5.2.0`. You can use it to install (and run) the **semantic-release** binary.
   See [What is npx](../support/FAQ.md#what-is-npx) for more details.

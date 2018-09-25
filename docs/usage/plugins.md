# Plugins

Each [release step](../../README.md#release-steps) is implemented by configurable plugins. This allows for support of different [commit message formats](../../README.md#commit-message-format), release note generators and publishing platforms.

A plugin is a npm module that can implement one or more of the following steps:

| Step               | Accept multiple | Required | Description                                                                                                                                                                                   |
|--------------------|-----------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `verifyConditions` | Yes             | No       | Responsible for verifying conditions necessary to proceed with the release: configuration is correct, authentication token are valid, etc...                                                  |
| `analyzeCommits`   | No              | Yes      | Responsible for determining the type of the next release (`major`, `minor` or `patch`).                                                                                                       |
| `verifyRelease`    | Yes             | No       | Responsible for verifying the parameters (version, type, dist-tag etc...) of the release that is about to be published.                                                                       |
| `generateNotes`    | Yes             | No       | Responsible for generating the content of the release note. If multiple `generateNotes` plugins are defined, the release notes will be the result of the concatenation of each plugin output. |
| `prepare`          | Yes             | No       | Responsible for preparing the release, for example creating or updating files such as `package.json`, `CHANGELOG.md`, documentation or compiled assets and pushing a commit.                  |
| `publish`          | Yes             | No       | Responsible for publishing the release.                                                                                                                                                       |
| `success`          | Yes             | No       | Responsible for notifying of a new release.                                                                                                                                                   |
| `fail`             | Yes             | No       | Responsible for notifying of a failed release.                                                                                                                                                |

See [available plugins](../extending/plugins-list.md).

## Plugins configuration

Each plugin must be installed and configured with the [`plugins` options](./configuration.md#plugins) by specifying the list of plugins by npm module name.

```bash
$ npm install @semantic-release/commit-analyzer @semantic-release/release-notes-generator @semantic-release/npm -D
```

```json
{
  "plugins": ["@semantic-release/commit-analyzer", "@semantic-release/release-notes-generator", "@semantic-release/npm"]
}
```

## Plugin ordering

For each [release step](../../README.md#release-steps) the plugins that implement that step will be executed in the order in which the are defined.

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/git"
  ]
}
```

With this configuration **semantic-release** will:
- execute the `verifyConditions` implementation of `@semantic-release/npm` then `@semantic-release/git`
- execute the `analyzeCommits` implementation of `@semantic-release/commit-analyzer`
- execute the `prepare` implementation of `@semantic-release/npm` then `@semantic-release/git`
- execute the `generateNotes` implementation of `@semantic-release/release-notes-generator`
- execute the `publish` implementation of `@semantic-release/npm`

## Plugin options

A plugin options can specified by wrapping the name and an options object in an array. Options configured this way will be passed only to that specific plugin.

Global plugin options can defined at the root of the **semantic-release** configuration object. Options configured this way will be passed to all plugins.

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/github", {
      "assets": ["dist/**"]
      }],
    "@semantic-release/git"
  ],
  "preset": "angular"
}
```

With this configuration:
- All plugins will receive the `preset` option, which will be used by both `@semantic-release/commit-analyzer` and `@semantic-release/release-notes-generator` (and ignored by `@semantic-release/github` and `@semantic-release/git`)
- The `@semantic-release/github` plugin will receive the `assets` options (`@semantic-release/git` will not receive it and therefore will use it's default value for that option)

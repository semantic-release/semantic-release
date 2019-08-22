# Plugins

## Plugins implement actions for release steps

Actions that should be performed for each [release step](../../README.md#release-steps) are implemented through configurable plugins, and [a number of them are installed by default](#plugins-installed-by-default). This allows for support of different [commit message formats](../../README.md#commit-message-format), release note generators and publishing platforms.

A plugin is a npm module (for instance `@semantic-release/github` or `semantic-release-docker`) that can implement one or more of the following steps through their step hooks:

| Step hook          | Required | Description                                                                                                                                                                                                          |
|--------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `verifyConditions` | No       | Responsible for verifying conditions necessary to proceed with the release: configuration is correct, authentication token are valid, etc...                                                                         |
| `analyzeCommits`   | Yes      | Responsible for determining the type of the next release (`major`, `minor` or `patch`). If multiple plugins with a `analyzeCommits` step are defined, the release type will be the highest one among plugins output. <br> **Note**: If no plugin with an `analyzeCommits` step is defined, then `@semantic-release/commit-analyzer` will be used.|
| `verifyRelease`    | No       | Responsible for verifying the parameters (version, type, dist-tag etc...) of the release that is about to be published.                                                                                              |
| `generateNotes`    | No       | Responsible for generating the content of the release note. If multiple plugins with a `generateNotes` step are defined, the release notes will be the result of the concatenation of each plugin output.            |
| `prepare`          | No       | Responsible for preparing the release, for example creating or updating files such as `package.json`, `CHANGELOG.md`, documentation or compiled assets and pushing a commit.                                         |
| `publish`          | No       | Responsible for publishing the release.                                                                                                                                                                              |
| `success`          | No       | Responsible for notifying of a new release.                                                                                                                                                                          |
| `fail`             | No       | Responsible for notifying of a failed release.                                                                                                                                                                       |

## Plugins installation

### Plugins installed by default

These five plugins are already part of **semantic-release** and don't have to be installed separately:
```
"@semantic-release/commit-analyzer"	
"@semantic-release/error"	
"@semantic-release/github"	
"@semantic-release/npm"	
"@semantic-release/release-notes-generator"
```

### Installing additional plugins

[Additional plugins](../02-extending/plugins-list.md) have to be installed via npm:

```bash
$ npm install @semantic-release/git @semantic-release/changelog -D
```

## Plugins declaration and execution order

Each plugin (which is an npm module) must be declared using the [`plugins` option](./configuration.md#plugins). If the `plugins` option is defined, then the default is overriden (rather than merge with the option's default).

For example:
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

For each [release step](../../README.md#release-steps) the plugins that implement that step will be executed **in the order in which they are declared**.

Hence, with this configuration above, **semantic-release** will:
- execute the `verifyConditions` implementation of `@semantic-release/npm` then `@semantic-release/git`
- execute the `analyzeCommits` implementation of `@semantic-release/commit-analyzer`
- execute the `prepare` implementation of `@semantic-release/npm` then `@semantic-release/git`
- execute the `generateNotes` implementation of `@semantic-release/release-notes-generator`
- execute the `publish` implementation of `@semantic-release/npm`

## Plugins configuration options

A plugin configuration options can specified by wrapping the name and an options object in an array. Options configured this way will be passed only to that specific plugin.

Global plugin options can defined at the root of the **semantic-release** configuration object. Options configured this way will be passed to all plugins.

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/github", {
      "assets": ["dist/**"]                # plugin configuration
      }],
    "@semantic-release/git"
  ],
  "preset": "angular"                      # option passed to all plugins
}
```

With this configuration:
- All plugins will receive the `preset` option, which will be used by both `@semantic-release/commit-analyzer` and `@semantic-release/release-notes-generator` (and ignored by `@semantic-release/github` and `@semantic-release/git`)
- The `@semantic-release/github` plugin will receive the `assets` options (`@semantic-release/git` will not receive it and therefore will use it's default value for that option)

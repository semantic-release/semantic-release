# Plugins

Each [release step](../../README.md#release-steps) is implemented within a plugin or a list of plugins that can be configured. This allows for support of different [commit message formats](../../README.md#commit-message-format), release note generators and publishing platforms.

See [plugins list](../extending/plugins-list.md).

## Plugin types

### verifyConditions plugin

Responsible for verifying conditions necessary to proceed with the release: configuration is correct, authentication token are valid, etc...

Default implementation: [@semantic-release/npm](https://github.com/semantic-release/npm#verifyconditions) and [@semantic-release/github](https://github.com/semantic-release/github#verifyconditions).<br>
Optional.<br>
Accept multiple plugins.

### analyzeCommits plugin

Responsible for determining the type of the next release (`major`, `minor` or `patch`).

Default implementation: [@semantic-release/commit-analyzer](https://github.com/semantic-release/commit-analyzer).<br>
Required.<br>
Accept only one plugin.

### verifyRelease plugin

Responsible for verifying the parameters (version, type, dist-tag etc...) of the release that is about to be published. For example the [cracks plugin](https://github.com/semantic-release/cracks) is able to verify that if a release contains breaking changes, its type must be `major`.

Default implementation: none.<br>
Optional.<br>
Accept multiple plugins.

### generateNotes plugin

Responsible for generating release notes. If multiple `generateNotes` plugins are defined, the release notes will be the result of the concatenation of plugin output.

Default implementation: [@semantic-release/release-notes-generator](https://github.com/semantic-release/release-notes-generator).<br>
Optional.<br>
Accept multiple plugins.

### prepare plugin

Responsible for preparing the release, including:
- Creating or updating files such as `package.json`, `CHANGELOG.md`, documentation or compiled assets.
- Create and push commits

Default implementation: [@semantic-release/npm](https://github.com/semantic-release/npm#prepare).<br>
Optional.<br>
Accept multiple plugins.

### publish plugin

Responsible for publishing the release.

Default implementation: [@semantic-release/npm](https://github.com/semantic-release/npm#publish) and [@semantic-release/github](https://github.com/semantic-release/github#publish).<br>
Optional.<br>
Accept multiple plugins.

### success plugin

Responsible for notifying of a new release.

Default implementation: [@semantic-release/github](https://github.com/semantic-release/github#success).<br>
Optional.<br>
Accept multiple plugins.

### fail plugin

Responsible for notifying of a failed release.

Default implementation: [@semantic-release/github](https://github.com/semantic-release/github#fail).<br>
Optional.<br>
Accept multiple plugins.

## Configuration

Plugin can be configured by specifying the plugin's module name or file path directly as a `String` or within the `path` key of an `Object`.

Plugins specific options can be set similarly to the other **semantic-release** [options](configuration.md#options) or within the plugin `Object`. Plugins options defined along with the other **semantic-release** [options](configuration.md#options) will apply to all plugins. Options defined within the plugin `Object` will apply to that specific plugin.

For example:
```json
{
  "release": {
    "verifyConditions": [
      {
        "path": "@semantic-release/exec",
        "cmd": "verify-conditions.sh"
      },
      "@semantic-release/npm",
      "@semantic-release/github"
    ],
    "analyzeCommits": "custom-plugin",
    "verifyRelease": [
      {
        "path": "@semantic-release/exec",
        "cmd": "verify-release.sh"
      },
    ],
    "generateNotes": "./build/my-plugin.js",
    "githubUrl": "https://my-ghe.com",
    "githubApiPathPrefix": "/api-prefix"
  }
}
```

With this configuration:
- the `custom-plugin` npm module will be used to [analyze commits](#analyzecommits-plugin)
- the `./build/my-plugin.js` script will be used to [generate release notes](#generatenotes-plugin)
- the [`@semantic-release/exec`](https://github.com/semantic-release/exec),  [`@semantic-release/npm`](https://github.com/semantic-release/npm) and [`@semantic-release/github`](https://github.com/semantic-release/github) plugins will be used to [verify conditions](#verifyconditions-plugin)
- the [`@semantic-release/exec`](https://github.com/semantic-release/exec) plugin will be used to [verify the release](#verifyrelease-plugin)
- the `cmd` option will be set to `verify-conditions.sh` only for the [`@semantic-release/exec`](https://github.com/semantic-release/exec) plugin used to [verify conditions](#verifyconditions-plugin)
- the `cmd` option will be set to `verify-release.sh` only for the [`@semantic-release/exec`](https://github.com/semantic-release/exec) plugin used to [verify the release](#verifyrelease-plugin)
- the `githubUrl` and `githubApiPathPrefix` options will be set to respectively `https://my-ghe.com` and `/api-prefix` for all plugins

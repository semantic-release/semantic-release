# Plugins

Each [release steps](../../README.md#release-steps) is implemented within a plugin or a list of plugins that can be configured, allowing to support different [commit message format](../../README.md#commit-message-format), release not generator and publishing platforms.

## Plugin types

### verifyConditions plugin

Plugin responsible for verifying all the conditions to proceed with the release: configuration is correct, authentication token are valid, etc...

Default implementation: [npm](https://github.com/semantic-release/npm#verifyconditions) and [github](https://github.com/semantic-release/github#verifyconditions).

### analyzeCommits plugin

Plugin responsible for determining the type of the next release (`major`, `minor` or `patch`).

Default implementation: [@semantic-release/commit-analyzer](https://github.com/semantic-release/commit-analyzer).

### verifyRelease plugin

Plugin responsible for verifying the parameters (version, type, dist-tag etc...) of the release that is about to be published match certain expectations. For example the [cracks plugin](https://github.com/semantic-release/cracks) allows to verify that if a release contains breaking changes, its type must be `major`.

Default implementation: none.

### generateNotes plugin

Plugin responsible for generating release notes.

Default implementation: [@semantic-release/release-notes-generator](https://github.com/semantic-release/release-notes-generator).

### publish plugin

Plugin responsible for publishing the release.

Default implementation: [npm](https://github.com/semantic-release/npm#publish) and [github](https://github.com/semantic-release/github#publish).

### success plugin

Plugin responsible for notifying of a new release.

Default implementation: [github](https://github.com/semantic-release/github#success).

### fail plugin

Plugin responsible for notifying of a failed release.

Default implementation: [github](https://github.com/semantic-release/github#fail).

## Configuration

Plugin can be configured by specifying the plugin's module name or file path directly as a `String` or within the `path` key of an `Object`.

Plugins specific options can be set similarly to the other **semantic-release** [options](configuration.md#options) or within the plugin `Object`. Plugins options defined along the other **semantic-release** [options](configuration.md#options) will apply to all plugins, while the one defined within the plugin `Object` will apply only to this specific plugin.

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
- the [`@semantic-release/exec`](https://github.com/semantic-release/exec),  [`@semantic-release/npm`](https://github.com/semantic-release/npm) and [`@semantic-release/exec`](https://github.com/semantic-release/exec) plugins will be used to [verify conditions](#verifyconditions-plugin)
- the [`@semantic-release/exec`](https://github.com/semantic-release/exec) plugin will be used to [verify the release](#verifyrelease-plugin)
- the `cmd` option will be set to `verify-conditions.sh` only for the [`@semantic-release/exec`](https://github.com/semantic-release/exec) plugin used to [verify conditions](#verifyconditions-plugin)
- the `cmd` option will be set to `verify-release.sh` only for the [`@semantic-release/exec`](https://github.com/semantic-release/exec) plugin used to [verify the release](#verifyrelease-plugin)
- the `githubUrl` and `githubApiPathPrefix` options will be set to respectively `https://my-ghe.com` and `/api-prefix` for all plugins

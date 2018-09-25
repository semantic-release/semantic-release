# Configuration

In order to customize **semantic-release**’s behavior, [options](#options) and [plugins](plugins.md) can be set via:
- A `.releaserc` file, written in YAML or JSON, with optional extensions: .`yaml`/`.yml`/`.json`/`.js`
- A `release.config.js` file that exports an object
- A `release` key in the project's `package.json` file
- CLI arguments

The following three examples are the same.

Via CLI argument:

```bash
$ semantic-release --branch next
```

Via `release` key in the project's `package.json` file:

```json
{
  "release": {
    "branch": "next"
  }
}
```
```bash
$ semantic-release
```

Via `.releaserc` file:

```json
{
  "branch": "next"
}
```
```bash
$ semantic-release
```

**Note**: CLI arguments take precedence over options configured in the configuration file.

**Note**: Plugin options cannot be defined via CLI arguments and must be defined in the configuration file.

**Note**: When configuring via `package.json`, the configuration must be under the `release` property. However, when using a `.releaserc` or a `release.config.js` file, the configuration must be set without a `release` property.

## Environment variables

| Variable              | Description                                                                                                                                                                                                                    | Default                              |
|-----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------|
| `GIT_AUTHOR_NAME`     | The author name associated with the [Git release tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging). See [Git environment variables](https://git-scm.com/book/en/v2/Git-Internals-Environment-Variables#_committing).     | @semantic-release-bot.               |
| `GIT_AUTHOR_EMAIL`    | The author email associated with the [Git release tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging). See [Git environment variables](https://git-scm.com/book/en/v2/Git-Internals-Environment-Variables#_committing).    | @semantic-release-bot email address. |
| `GIT_COMMITTER_NAME`  | The committer name associated with the [Git release tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging). See [Git environment variables](https://git-scm.com/book/en/v2/Git-Internals-Environment-Variables#_committing).  | @semantic-release-bot.               |
| `GIT_COMMITTER_EMAIL` | The committer email associated with the [Git release tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging). See [Git environment variables](https://git-scm.com/book/en/v2/Git-Internals-Environment-Variables#_committing). | @semantic-release-bot email address. |

## Options

### extends

Type: `Array`, `String`<br>
CLI arguments: `-e`, `--extends`

List of modules or file paths containing a [shareable configuration](shareable-configurations.md). If multiple shareable configurations are set, they will be imported in the order defined with each configuration option taking precedence over the options defined in a previous shareable configuration.

**Note**: Options defined via CLI arguments or in the configuration file will take precedence over the ones defined in any shareable configuration.

### branch

Type: `String`<br>
Default: `master`<br>
CLI arguments: `-b`, `--branch`

The branch on which releases should happen.

### repositoryUrl

Type: `String`<br>
Default: `repository` property in `package.json` or [git origin url](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes)<br>
CLI arguments: `-r`, `--repository-url`

The git repository URL.

Any valid git url format is supported (See [Git protocols](https://git-scm.com/book/en/v2/Git-on-the-Server-The-Protocols)).

### tagFormat

Type: `String`<br>
Default: `v${version}`<br>
CLI arguments: `-t`, `--tag-format`

The [Git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging) format used by **semantic-release** to identify releases. The tag name is generated with [Lodash template](https://lodash.com/docs#template) and will be compiled with the `version` variable.

**Note**: The `tagFormat` must contain the `version` variable exactly once and compile to a [valid Git reference](https://git-scm.com/docs/git-check-ref-format#_description).

### plugins

Type: `Array`<br>
Default: `['@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator', '@semantic-release/npm', '@semantic-release/github']`<br>
CLI arguments: `-p`, `--plugins`

Define the list of plugins to use. Plugins will run in series, in the order defined, for each [steps](../../README.md#release-steps) if they implement it.

Plugins configuration can defined by wrapping the name and an options object in an array.

See [Plugins configuration](plugins.md#configuration) for more details.

### dryRun

Type: `Boolean`<br>
Default: `false` if running in a CI environment, `true` otherwise<br>
CLI arguments: `-d`, `--dry-run`

Dry-run mode, skip publishing, print next version and release notes.

### ci

Type: `Boolean`<br>
Default: `true`<br>
CLI arguments: `--ci` / `--no-ci`

Set to `fasle` to skip Continuous Integration environment verifications. This allows for making releases from a local machine.

**Note**: The CLI arguments `--no-ci` is equivalent to `--ci false`.

### debug

Type: `Boolean`<br>
Default: `false`<br>
CLI argument: `--debug`

Output debugging information. It can also be enabled by setting the `DEBUG` environment variable to `semantic-release:*`.

### verifyConditions

Type: `Array`, `String`, `Object`<br>
Default: `['@semantic-release/npm', '@semantic-release/github']`<br>
CLI argument: `--verify-conditions`

Define the list of [verify conditions plugins](plugins.md#verifyconditions-plugin). Plugins will run in series, in the order defined in the `Array`.

See [Plugins configuration](plugins.md#configuration) for more details.

### analyzeCommits

Type: `String`, `Object`<br>
Default: `'@semantic-release/commit-analyzer'`<br>
CLI argument: `--analyze-commits`

Define the [analyze commits plugin](plugins.md#analyzecommits-plugin).

See [Plugins configuration](plugins.md#configuration) for more details.

### verifyRelease

Type: `Array`, `String`, `Object`<br>
Default: `[]`<br>
CLI argument: `--verify-release`

Define the list of [verify release plugins](plugins.md#verifyrelease-plugin). Plugins will run in series, in the order defined in the `Array`.

See [Plugins configuration](plugins.md#configuration) for more details.

### generateNotes

Type: `Array`, `String`, `Object`<br>
Default: `['@semantic-release/release-notes-generator']`<br>
CLI argument: `--generate-notes`

Define the [generate notes plugins](plugins.md#generatenotes-plugin).

See [Plugins configuration](plugins.md#configuration) for more details.

### prepare

Type: `Array`, `String`, `Object`<br>
Default: `['@semantic-release/npm']`<br>
CLI argument: `--prepare`

Define the list of [prepare plugins](plugins.md#prepare-plugin). Plugins will run in series, in the order defined in the `Array`.

See [Plugins configuration](plugins.md#configuration) for more details.

### publish

Type: `Array`, `String`, `Object`<br>
Default: `['@semantic-release/npm', '@semantic-release/github']`<br>
CLI argument: `--publish`

Define the list of [publish plugins](plugins.md#publish-plugin). Plugins will run in series, in the order defined in the `Array`.

See [Plugins configuration](plugins.md#configuration) for more details.

### success

Type: `Array`, `String`, `Object`<br>
Default: `['@semantic-release/github']`<br>
CLI argument: `--success`

Define the list of [success plugins](plugins.md#success-plugin). Plugins will run in series, in the order defined in the `Array`.

See [Plugins configuration](plugins.md#configuration) for more details.

### fail

Type: `Array`, `String`, `Object`<br>
Default: `['@semantic-release/github']`<br>
CLI argument: `--fail`

Define the list of [fail plugins](plugins.md#fail-plugin). Plugins will run in series, in the order defined in the `Array`.

See [Plugins configuration](plugins.md#configuration) for more details.

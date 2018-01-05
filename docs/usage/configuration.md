# Configuration

In order to customize **semantic-release**’s behavior, [options](#options) and [plugins](plugins.md) can be set via:
- A `.releaserc` file, written in YAML or JSON, with optional extensions: .`yaml`/`.yml`/`.json`/`.js`
- A `release.config.js` file that exports an object
- A `release` key in the project's `package.json` file
- CLI arguments

The following two examples are the same.

Via CLI argument:

```bash
$ semantic-release --branch next
```

Via `release` key in the project's `package.json` file:

```json
"release": {
  "branch": "next"
}
```
```bash
$ semantic-release
```

**Note**: CLI arguments take precedence over options configured in the configuration file.

**Note**: Plugins options cannot be defined via CLI arguments and must be defined in the configuration file.

## Options

### extends

Type: `Array`, `String`

CLI arguments: `-e`, `--extends`

List of modules or file paths containing a [shareable configuration](shareable-configurations.md). If multiple shareable configuration are set, they will be imported in the order defined with each configuration option taking precedence over the options defined in a previous shareable configuration.

**Note**: Options defined via CLI arguments or in the configuration file will take precedence over the ones defined in any shareable configuration.

### branch

Type: `String`

Default: `master`

CLI arguments: `-b`, `--branch`

The branch on which releases should happen.

### repositoryUrl

Type: `String`

Default: `repository` property in `package.json` or [git origin url](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes)

CLI arguments: `-r`, `--repository-url`

The git repository URL

Any valid git url format is supported (See [Git protocols](https://git-scm.com/book/en/v2/Git-on-the-Server-The-Protocols)).

**Note**: If the [Github plugin](https://github.com/semantic-release/github) is used the URL must be a valid Github URL that include the `owner`, the `repository` name and the `host`. **The Github shorthand URL is not supported.**

### dryRun

Type: `Boolean`

Default: `false` if running in a CI environment, `false` otherwise

CLI arguments: `-d`, `--dry-run`

Dry-run mode, skip publishing, print next version and release notes.

### noCi

Type: `Boolean`

Default: `false`

CLI arguments: `--no-ci`

Skip Continuous Integration environment verifications, allowing to make releases from a local machine.

### debug

Type: `Boolean`

Default: `false`

CLI argument: `--debug`

Output debugging information. It can also be enabled by set the `DEBUG` environment variable to `semantic-release`.

### verifyConditions

Type: `Array`, `String`, `Object`

Default: `['@semantic-release/npm', '@semantic-release/github']`

CLI argument: `--verify-conditions`

Define the list of [verify conditions plugins](plugins.md#verifyconditions-plugin). Plugins will run in series, in the order defined in the `Array`.

See [Plugins configuration](plugins.md#configuration) for more details.

### getLastRelease

Type: `String`, `Object`

Default: `['@semantic-release/npm']`

CLI argument: `--get-last-release`

Define the [get last release plugin](plugins.md#getlastrelease-plugin).

See [Plugins configuration](plugins.md#configuration) for more details.

### analyzeCommits

Type: `String`, `Object`

Default: `['@semantic-release/commit-analyzer']`

CLI argument: `--analyze-commits`

Define the [analyze commits plugin](plugins.md#analyzecommits-plugin).

See [Plugins configuration](plugins.md#configuration) for more details.

### verifyRelease

Type: `Array`, `String`, `Object`

Default: `[]`

CLI argument: `--verify-release`

Define the list of [verify release plugins](plugins.md#verifyrelease-plugin). Plugins will run in series, in the order defined in the `Array`.

See [Plugins configuration](plugins.md#configuration) for more details.

### generateNotes

Type: `String`, `Object`

Default: `['@semantic-release/release-notes-generator']`

CLI argument: `--generate-notes`

Define the [generate notes plugin](plugins.md#generatenotes-plugin).

See [Plugins configuration](plugins.md#configuration) for more details.

### publish

Type: `Array`, `String`, `Object`

Default: `['@semantic-release/npm', '@semantic-release/github']`

CLI argument: `--publish`

Define the list of [publish plugins](plugins.md#publish-plugin). Plugins will run in series, in the order defined in the `Array`.

See [Plugins configuration](plugins.md#configuration) for more details.

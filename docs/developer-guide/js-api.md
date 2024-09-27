# JavaScript API

## Usage

```js
const semanticRelease = require("semantic-release");
const { WritableStreamBuffer } = require("stream-buffers");

const stdoutBuffer = new WritableStreamBuffer();
const stderrBuffer = new WritableStreamBuffer();

try {
  const result = await semanticRelease(
    {
      // Core options
      branches: [
        "+([0-9])?(.{+([0-9]),x}).x",
        "master",
        "main",
        "next",
        "next-major",
        { name: "beta", prerelease: true },
        { name: "alpha", prerelease: true },
      ],
      repositoryUrl: "https://github.com/me/my-package.git",
      // Shareable config
      extends: "my-shareable-config",
      // Plugin options
      githubUrl: "https://my-ghe.com",
      githubApiPathPrefix: "/api-prefix",
    },
    {
      // Run semantic-release from `/path/to/git/repo/root` without having to change local process `cwd` with `process.chdir()`
      cwd: "/path/to/git/repo/root",
      // Pass the variable `MY_ENV_VAR` to semantic-release without having to modify the local `process.env`
      env: { ...process.env, MY_ENV_VAR: "MY_ENV_VAR_VALUE" },
      // Store stdout and stderr to use later instead of writing to `process.stdout` and `process.stderr`
      stdout: stdoutBuffer,
      stderr: stderrBuffer,
    }
  );

  if (result) {
    const { lastRelease, commits, nextRelease, releases } = result;

    console.log(
      `Published ${nextRelease.type} release version ${nextRelease.version} containing ${commits.length} commits.`
    );

    if (lastRelease.version) {
      console.log(`The last release was "${lastRelease.version}".`);
    }

    for (const release of releases) {
      console.log(`The release was published with plugin "${release.pluginName}".`);
    }
  } else {
    console.log("No release published.");
  }

  // Get stdout and stderr content
  const logs = stdoutBuffer.getContentsAsString("utf8");
  const errors = stderrBuffer.getContentsAsString("utf8");
} catch (err) {
  console.error("The automated release failed with %O", err);
}
```

## API

### semanticRelease([options], [config]) => Promise<Result>

Run **semantic-release** and returns a `Promise` that resolves to a [Result](#result) object.

#### options

Type: `Object`

**semantic-release** options.

Can be used to set any [core option](../usage/configuration.md#configuration) or [plugin options](../usage/plugins.md#configuration).

Each option, will take precedence over options configured in the [configuration file](../usage/configuration.md#configuration) and [shareable configurations](../usage/configuration.md#extends).

#### config

Type: `Object`

**semantic-release** configuration specific for API usage.

##### cwd

Type: `String`<br>
Default: `process.cwd()`

The current working directory to use. It should be configured to the root of the Git repository to release from.

It allows to run **semantic-release** from a specific path without having to change the local process `cwd` with `process.chdir()`.

##### env

Type: `Object`<br>
Default: `process.env`

The environment variables to use.

It allows to run **semantic-release** with specific environment variables without having to modify the local `process.env`.

##### stdout

Type: [`stream.Writable`](https://nodejs.org/api/stream.html#stream_writable_streams)<br>
Default: `process.stdout`

The [writable stream](https://nodejs.org/api/stream.html#stream_writable_streams) used to log information.

It allows to configure **semantic-release** to write logs to a specific stream rather than the local `process.stdout`.

##### stderr

Type: [`stream.Writable`](https://nodejs.org/api/stream.html#stream_writable_streams)<br>
Default: `process.stderr`

The [writable stream](https://nodejs.org/api/stream.html#stream_writable_streams) used to log errors.

It allows to configure **semantic-release** to write errors to a specific stream rather than the local `process.stderr`.

### Result

Type: `Object` `Boolean`<br>

An object with [`lastRelease`](#lastrelease), [`nextRelease`](#nextrelease), [`commits`](#commits) and [`releases`](#releases) if a release is published or `false` if no release was published.

#### lastRelease

Type: `Object`

Information related to the last release found:

| Name    | Type     | Description                                                                                                                         |
| ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| version | `String` | The version of the last release.                                                                                                    |
| gitHead | `String` | The sha of the last commit being part of the last release.                                                                          |
| gitTag  | `String` | The [Git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging) associated with the last release.                                  |
| channel | `String` | The distribution channel on which the last release was initially made available (`undefined` for the default distribution channel). |

**Note**: If no previous release is found, `lastRelease` will be an empty `Object`.

Example:

```js
{
  gitHead: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
  version: '1.0.0',
  gitTag: 'v1.0.0',
  channel: 'next'
}
```

#### commits

Type: `Array<Object>`

The list of commit(s) included in the new release.<br>
Each commit object has the following properties:

| Name            | Type     | Description                                     |
| --------------- | -------- | ----------------------------------------------- |
| commit          | `Object` | The commit abbreviated and full hash.           |
| commit.long     | `String` | The commit hash.                                |
| commit.short    | `String` | The commit abbreviated hash.                    |
| tree            | `Object` | The commit abbreviated and full tree hash.      |
| tree.long       | `String` | The commit tree hash.                           |
| tree.short      | `String` | The commit abbreviated tree hash.               |
| author          | `Object` | The commit author information.                  |
| author.name     | `String` | The commit author name.                         |
| author.email    | `String` | The commit author email.                        |
| author.short    | `String` | The commit author date.                         |
| committer       | `Object` | The committer information.                      |
| committer.name  | `String` | The committer name.                             |
| committer.email | `String` | The committer email.                            |
| committer.short | `String` | The committer date.                             |
| subject         | `String` | The commit subject.                             |
| body            | `String` | The commit body.                                |
| message         | `String` | The commit full message (`subject` and `body`). |
| hash            | `String` | The commit hash.                                |
| committerDate   | `String` | The committer date.                             |

Example:

```js
[
  {
    commit: {
      long: '68eb2c4d778050b0701136ca129f837d7ed494d2',
      short: '68eb2c4'
    },
    tree: {
      long: '7ab515d12bd2cf431745511ac4ee13fed15ab578',
      short: '7ab515d'
    },
    author: {
      name: 'Me',
      email: 'me@email.com',
      date: 2018-07-22T20:52:44.000Z
    },
    committer: {
      name: 'Me',
      email: 'me@email.com',
      date: 2018-07-22T20:52:44.000Z
    },
    subject: 'feat: a new feature',
    body: 'Description of the new feature',
    hash: '68eb2c4d778050b0701136ca129f837d7ed494d2',
    message: 'feat: a new feature\n\nDescription of the new feature',
    committerDate: 2018-07-22T20:52:44.000Z
  }
 ]
```

#### nextRelease

Type: `Object`

Information related to the newly published release:

| Name    | Type     | Description                                                                                                                   |
| ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| type    | `String` | The [semver](https://semver.org) type of the release (`patch`, `minor` or `major`).                                           |
| version | `String` | The version of the new release.                                                                                               |
| gitHead | `String` | The sha of the last commit being part of the new release.                                                                     |
| gitTag  | `String` | The [Git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging) associated with the new release.                             |
| notes   | `String` | The release notes for the new release.                                                                                        |
| channel | `String` | The distribution channel on which the next release will be made available (`undefined` for the default distribution channel). |

Example:

```js
{
  type: 'minor',
  gitHead: '68eb2c4d778050b0701136ca129f837d7ed494d2',
  version: '1.1.0',
  gitTag: 'v1.1.0',
  notes: 'Release notes for version 1.1.0...',
  channel : 'next'
}
```

#### releases

Type: `Array<Object>`

The list of releases published or made available to a distribution channel.<br>
Each release object has the following properties:

| Name       | Type     | Description                                                                                                    |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| name       | `String` | **Optional.** The release name, only if set by the corresponding `publish` plugin.                             |
| url        | `String` | **Optional.** The release URL, only if set by the corresponding `publish` plugin.                              |
| type       | `String` | The [semver](https://semver.org) type of the release (`patch`, `minor` or `major`).                            |
| version    | `String` | The version of the release.                                                                                    |
| gitHead    | `String` | The sha of the last commit being part of the release.                                                          |
| gitTag     | `String` | The [Git tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging) associated with the release.                  |
| notes      | `String` | The release notes for the release.                                                                             |
| pluginName | `String` | The name of the plugin that published the release.                                                             |
| channel    | `String` | The distribution channel on which the release is available (`undefined` for the default distribution channel). |

Example:

```js
[
  {
    name: 'GitHub release',
    url: 'https://github.com/me/my-package/releases/tag/v1.1.0',
    type: 'minor',
    gitHead: '68eb2c4d778050b0701136ca129f837d7ed494d2',
    version: '1.1.0',
    gitTag: 'v1.1.0',
    notes: 'Release notes for version 1.1.0...',
    pluginName: '@semantic-release/github'
    channel: 'next'
  },
  {
    name: 'npm package (@latest dist-tag)',
    url: 'https://www.npmjs.com/package/my-package',
    type: 'minor',
    gitHead: '68eb2c4d778050b0701136ca129f837d7ed494d2',
    version: '1.1.0',
    gitTag: 'v1.1.0',
    notes: 'Release notes for version 1.1.0...',
    pluginName: '@semantic-release/npm'
    channel: 'next'
   }
 ]
```

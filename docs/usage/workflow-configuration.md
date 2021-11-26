# Workflow configuration

**semantic-release** allow to manage and automate complex release workflow, based on multiple Git branches and distribution channels. This allow to:
- Distribute certain releases to a particular group of users via distribution channels
- Manage the availability of releases on distribution channels via branches merge
- Maintain multiple lines of releases in parallel
- Work on large future releases outside the normal flow of one version increment per Git push

See [Release workflow recipes](../recipes/release-workflow/README.md#release-workflow) for detailed examples.

The release workflow is configured via the [branches option](./configuration.md#branches) which accepts a single or an array of branch definitions.
Each branch can be defined either as a string, a [glob](https://github.com/micromatch/micromatch#matching-features) or an object. For string and glob definitions each [property](#branches-properties) will be defaulted.

A branch can defined as one of three types:
- [release](#release-branches): to make releases on top of the last version released
- [maintenance](#maintenance-branches): to make releases on top of an old release
- [pre-release](#pre-release-branches): to make pre-releases

The type of the branch is automatically determined based on naming convention and/or [properties](#branches-properties).

## Branches properties

| Property     | Branch type                               | Description                                                                                                                                                                             | Default                                                                                         |
|--------------|-------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| `name`       | All                                       | **Required.** The Git branch holding the commits to analyze and the code to release. See [name](#name).                                                                                 | - The value itself if defined as a `String` or the matching branches name if defined as a glob. |
| `channel`    | All                                       | The distribution channel on which to publish releases from this branch. Set to `false` to force the default distribution channel instead of using the default. See [channel](#channel). | `undefined` for the first release branch, the value of `name` for subsequent ones.              |
| `range`      | [maintenance](#maintenance-branches) only | **Required unless `name` is formatted like `N.N.x` or `N.x` (`N` is a number).** The range of [semantic versions](https://semver.org) to support on this branch. See [range](#range).   | The value of `name`.                                                                            |
| `prerelease` | [pre-release](#pre-release-branches) only | **Required.** The pre-release denotation to append to [semantic versions](https://semver.org) released from this branch. See [prerelease](#prerelease).                                 | -                                                                                               |

### name

A `name` is required for any type of branch.
It can be defined as a [glob](https://github.com/micromatch/micromatch#matching-features) in which case the definition will be expanded to one per matching branch existing in the repository.

If `name` doesn't match to any branch existing in the repository, the definition will be ignored. For example the default configuration includes the definition `next` and `next-major` which will become active only when the branches `next` and/or `next-major` are created in the repository. This allow to define your workflow once with all potential branches you might use and have the effective configuration evolving as you create new branches.

For example the configuration `['+([0-9])?(.{+([0-9]),x}).x', 'master', 'next']` will be expanded as:
```js
{
  branches: [
    {name: '1.x', range: '1.x', channel: '1.x'}, // Only after the `1.x` is created in the repo
    {name: '2.x', range: '2.x', channel: '2.x'}, // Only after the `2.x` is created in the repo
    {name: 'master'},
    {name: 'next', channel: 'next'}, // Only after the `next` is created in the repo
  ]
}
```

### channel

The `channel` can be defined for any branch type. By default releases will be done on the default distribution channel (for example the `@latest` [dist-tag](https://docs.npmjs.com/cli/dist-tag) for npm) for the first [release branch](#release-branches) and on a distribution channel named based on the branch `name` for any other branch.
If the `channel` property is set to `false` the default channel will be used.

The value of `channel`, if defined as a string, is generated with [Lodash template](https://lodash.com/docs#template) with the variable `name` available.

For example the configuration `['master', {name: 'next', channel: 'channel-${name}'}]` will be expanded as:
```js
{
  branches: [
    {name: 'master'}, // `channel` is undefined so the default distribution channel will be used
    {name: 'next', channel: 'channel-next'}, // `channel` is built with the template `channel-${name}`
  ]
}
```

### range

A `range` only applies to maintenance branches, is required and must be formatted like `N.N.x` or `N.x` (`N` is a number). In case the `name` is formatted as a range (for example `1.x` or `1.5.x`) the branch will be considered a maintenance branch and the `name` value will be used for the `range`.

For example the configuration `['1.1.x', '1.2.x', 'master']` will be expanded as:
```js
{
  branches: [
    {name: '1.1.x', range: '1.1.x', channel: '1.1.x'},
    {name: '1.2.x', range: '1.2.x', channel: '1.2.x'},
    {name: 'master'},
  ]
}
```

### prerelease

A `prerelease` property applies only to pre-release branches and the `prerelease` value must be valid per the [Semantic Versioning Specification](https://semver.org/#spec-item-9). It will determine the name of versions (for example if `prerelease` is set to `beta` the version be formatted like `2.0.0-beta.1`, `2.0.0-beta.2` etc...).
If the `prerelease` property is set to `true` the `name` value will be used.

The value of `prerelease`, if defined as a string, is generated with [Lodash template](https://lodash.com/docs#template) with the variable `name` available.

For example the configuration `['master', {name: 'pre/rc', prerelease: '${name.replace(/^pre\\//g, "")}'}, {name: 'beta', prerelease: true}]` will be expanded as:
```js
{
  branches: [
    {name: 'master'},
    {name: 'pre/rc', channel: 'pre/rc', prerelease: 'rc'}, // `prerelease` is built with the template `${name.replace(/^pre\\//g, "")}`
    {name: 'beta', channel: 'beta', prerelease: 'beta'}, // `prerelease` is set to `beta` as it is the value of `name`
  ]
}
```

## Branch types

### Release branches

A release branch is the base type of branch used by **semantic-release** that allows to publish releases with a [semantic version](https://semver.org), optionally on a specific distribution channel. Distribution channels (for example [npm dist-tags](https://docs.npmjs.com/cli/dist-tag) or [Chrome release channels](https://www.chromium.org/getting-involved/dev-channel)) are a way to distribute new releases only to a subset of users in order to get early feedback. Later on, those releases can be added to the general distribution channel to be made available to all users.

**semantic-release** will automatically add releases to the corresponding distribution channel when code is [merged from a release branch to another](#merging-into-a-release-branch).

A project must define a minimum of 1 release branch and can have a maximum of 3. The order of the release branch definitions is significant, as versions released on a given branch must always be higher than the last release made on the previous branch. This allow to avoid situation that would lead to an attempt to publish releases with the same version number but different codebase. When multiple release branches are configured and a commit that would create a version conflict is pushed, **semantic-release** will not perform the release and will throw an `EINVALIDNEXTVERSION` error, listing the problematic commits and the valid branches on which to move them.

**Note:** With **semantic-release** as with most package managers, a release version must be unique, independently of the distribution channel on which it is available.

See [publishing on distribution channels recipe](../recipes/release-workflow/distribution-channels.md) for a detailed example.

#### Pushing to a release branch

With the configuration `"branches": ["master", "next"]`, if the last release published from `master` is `1.0.0` and the last one from `next` is `2.0.0` then:
- Only versions in range `1.x.x` can be published from `master`, so only `fix` and `feat` commits can be pushed to `master`
- Once `next` get merged into `master` the release `2.0.0` will be made available on the channel associated with `master` and both `master` and `next` will accept any commit type

This verification prevent scenario such as:
1. Create a `feat` commit on `next` which triggers the release of version `1.0.0` on the `next` channel
2. Merge `next` into `master` which adds `1.0.0` on the default channel
3. Create a `feat` commit on `next` which triggers the release of version `1.1.0` on the `next` channel
4. Create a `feat` commit on `master` which would attempt to release the version `1.1.0` on the default channel

In step 4 **semantic-release** will throw an `EINVALIDNEXTVERSION` error to prevent the attempt at releasing version `1.1.0` which was already released on step 3 with a different codebase. The error will indicate that the commit should be created on `next` instead. Alternatively if the `next` branch is merged into `master`, the version `1.1.0` will be made available on the default channel and the `feat` commit would be allowed on `master` to release `1.2.0`.

#### Merging into a release branch

When merging commits associated with a release from one release branch to another, **semantic-release** will make the corresponding version available on the channel associated with the target branch.

When merging commits not associated with a release, commits from a [maintenance branch](#maintenance-branches) or commits from a [pre-release branch](#pre-release-branches) **semantic-release** will treat them as [pushed commits](#pushing-to-a-release-branch) and publish a new release if necessary.

### Maintenance branches

A maintenance branch is a type of branch used by **semantic-release** that allows to publish releases with a [semantic version](https://semver.org) on top of the codebase of an old release. This is useful when you need to provide fixes or features to users who cannot upgrade to the last version of your package.

A maintenance branch is characterized by a range which defines the versions that can be published from it. The [`range`](#range) value of each maintenance branch must be unique across the project.

**semantic-release** will always publish releases to a distribution channel specific to the range, so only the users who choose to use that particular line of versions will receive new releases.

Maintenance branches are always considered lower than [release branches](#release-branches) and similarly to them, when a commit that would create a version conflict is pushed, **semantic-release** will not perform the release and will throw an `EINVALIDNEXTVERSION` error, listing the problematic commits and the valid branches on which to move them.

**semantic-release** will automatically add releases to the corresponding distribution channel when code is [merged from a release or maintenance branch to another maintenance branch](#merging-into-a-maintenance-branch), however only versions within the branch `range` can be merged. If a merged version is outside the maintenance branch `range`, **semantic-release** will not add to the corresponding channel and will throw an `EINVALIDMAINTENANCEMERGE` error.

See [publishing maintenance releases recipe](../recipes/release-workflow/maintenance-releases.md) for a detailed example.

#### Pushing to a maintenance branch

With the configuration `"branches": ["1.0.x", "1.x", "master"]`, if the last release published from `master` is `1.5.0` then:
- Only versions in range `>=1.0.0 <1.1.0` can be published from `1.0.x`, so only `fix` commits can be pushed to `1.0.x`
- Only versions in range `>=1.1.0 <1.5.0` can be published from `1.x`, so only `fix` and `feat` commits can be pushed to `1.x` as long the resulting release is lower than `1.5.0`
- Once `2.0.0` is released from `master`, versions in range `>=1.1.0 <2.0.0` can be published from `1.x`, so any number of `fix` and `feat` commits can be pushed to `1.x`

#### Merging into a maintenance branch

With the configuration `"branches": ["1.0.x", "1.x", "master"]`, if the last release published from `master` is `1.0.0` then:
- Creating the branch `1.0.x` from `master` will make the `1.0.0` release available on the `1.0.x` distribution channel
- Pushing a `fix` commit on the `1.0.x` branch will release the version `1.0.1` on the `1.0.x` distribution channel
- Creating the branch `1.x` from `master` will make the `1.0.0` release available on the `1.x` distribution channel
- Merging the branch `1.0.x` into `1.x` will make the version `1.0.1` available on the `1.x` distribution channel

### Pre-release branches

A pre-release branch is a type of branch used by **semantic-release** that allows to publish releases with a [pre-release version](https://semver.org/#spec-item-9).
Using a pre-release version allow to publish multiple releases with the same version. Those release will be differentiated via their identifiers (in `1.0.0-alpha.1` the identifier is `alpha.1`).
This is useful when you need to work on a future major release that will include many breaking changes but you do not want to increment the version number for each breaking change commit.

A pre-release branch is characterized by the `prerelease` property that defines the static part of the version released (in `1.0.0-alpha.1` the static part fo the identifier is `alpha`). The [`prerelease`](#prerelease) value of each pre-release branch must be unique across the project.

**semantic-release** will always publish pre-releases to a specific distribution channel, so only the users who choose to use that particular line of versions will receive new releases.

When merging commits associated with an existing release, **semantic-release** will treat them as [pushed commits](#pushing-to-a-pre-release-branch) and publish a new release if necessary, but it will never add those releases to the distribution channel corresponding to the pre-release branch.

See [publishing pre-releases recipe](../recipes/release-workflow/pre-releases.md) for a detailed example.

#### Pushing to a pre-release branch

With the configuration `"branches": ["master", {"name": "beta", "prerelease": true}]`, if the last release published from `master` is `1.0.0` then:
- Pushing a `BREAKING CHANGE` commit on the `beta` branch will release the version `2.0.0-beta.1` on the `beta` distribution channel
- Pushing either a `fix`, `feat` or a `BREAKING CHANGE` commit on the `beta` branch will release the version `2.0.0-beta.2` (then `2.0.0-beta.3`, `2.0.0-beta.4`, etc...) on the `beta` distribution channel

#### Merging into a pre-release branch

With the configuration `"branches": ["master", {"name": "beta", "prerelease": true}]`, if the last release published from `master` is `1.0.0` and the last one published from `beta` is `2.0.0-beta.1` then:
- Pushing a `fix` commit on the `master` branch will release the version `1.0.1` on the default distribution channel
- Merging the branch `master` into `beta` will release the version `2.0.0-beta.2` on the `beta` distribution channel

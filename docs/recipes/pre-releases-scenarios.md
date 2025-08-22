# Pre-releases scenarios

This recipe will walk you through some real life scenarios of publishing pre-release versions alongside releasing on the default distribution version simultaneously.

Unlike [Publishing pre-releases](https://github.com/semantic-release/semantic-release/blob/master/docs/recipes/pre-releases.md), this examples does not start with a breaking change but instead with a minor or patch one (`fix` and `feat`), allowing to demonstrate more complex cases.

This example uses the **semantic-release** default configuration:

- [branches](../usage/configuration.md#branches): `['+([0-9])?(.{+([0-9]),x}).x', 'master', 'next', 'next-major', {name: 'beta', prerelease: true}, {name: 'alpha', prerelease: true}]`
- [plugins](../usage/configuration.md#plugins): `['@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator', '@semantic-release/npm', '@semantic-release/github']`

<hr>

- [Pre-releases scenarios](#pre-releases-scenarios)
- [Examples](#examples)
  - [Pre release of a feature with fixes](#pre-release-of-a-feature-with-fixes)
    - [1. Initial version](#1-initial-version)
    - [2. First feature on beta](#2-first-feature-on-beta)
    - [3. Second feature on beta](#3-second-feature-on-beta)
    - [4. First fix on beta](#4-first-fix-on-beta)
    - [5. Third feature on beta](#5-third-feature-on-beta)
    - [6. First fix on the default channel](#6-first-fix-on-the-default-channel)
    - [7. Publishing the 1.1.0 beta release to the default distribution channel](#7-publishing-the-110-beta-release-to-the-default-distribution-channel)
  - [Pre release of a fix with features](#pre-release-of-a-fix-with-features)
    - [1. Initial version](#1-initial-version-1)
    - [2. First fix on beta](#2-first-fix-on-beta)
    - [3. First feature on beta](#3-first-feature-on-beta)
    - [4. Second fix on beta](#4-second-fix-on-beta)
    - [5. Second feature on beta](#5-second-feature-on-beta)
    - [6. First fix on the default channel](#6-first-fix-on-the-default-channel-1)
    - [7. Publishing the 1.1.0 beta release to the default distribution channel](#7-publishing-the-110-beta-release-to-the-default-distribution-channel-1)

# Examples

## Pre release of a feature with fixes

```
* feat: initial commit # => v1.0.0 on @latest [1]
| \
|  * feat: first feat on beta            # => v1.1.0-beta.1 on @beta [2]
|  * feat: second feat on beta           # => v1.1.0-beta.2 on @beta [3]
|  * fix: first fix on beta              # => v1.1.0-beta.3 on @beta [4]
|  * feat: third feat on beta            # => v1.1.0-beta.4 on @beta [5]
*  | fix: a fix on master # => v1.0.1 on @latest [6]
*  |  | Merge branch beta into master # => v1.1.0 on @latest [7]
```

### 1. Initial version

We'll start by making the first commit of the project, when pushing that commit on master, **semantic-release** will release the version `1.0.0` on the `@latest` dist-tag.

### 2. First feature on beta

We now decided to work on a new future pre-release feature for our product. We create the branch `beta` from the branch `master` and commit our feature (`feat: first feat on beta`), **semantic-release** will publish the pre-release version `1.1.0-beta.1` on the dist-tag `@beta`.

### 3. Second feature on beta

We now decided add another feature to our pre-release channel, **semantic-release** will publish the pre-release version `1.1.0-beta.2` on the dist-tag `@beta`.

### 4. First fix on beta

We found a bug in our pre-release so we've added the commit `fix: first fix on beta` to the pre-release channel, **semantic-release** will publish the pre-release version `1.1.0-beta.3` on the dist-tag `@beta`.

### 5. Third feature on beta

We've added the third and final feature on beta, **semantic-release** will publish the pre-release version `1.1.0-beta.4` on the dist-tag `@beta`.

### 6. First fix on the default channel

Alongside our work on `beta`, a bug was found on the `master` branch and was fixed with `fix: a fix on master`, **semantic-release** will publish version `1.0.1` on the dist-tag `@latest`.

### 7. Publishing the 1.1.0 beta release to the default distribution channel

Once we've developed and pushed all the feature we want to include in the future version `1.1.0` in the `beta` branch and all our tests are successful we can release it to our users.

To do so we need to merge our changes made on `beta` into `master`. As `beta` and `master` branches have diverged, this merge might require to resolve conflicts.

Once the conflicts are resolved and the merge commit is pushed to master, semantic-release will release the version `1.1.0` on the dist-tag `@latest`.

## Pre release of a fix with features

```
* feat: initial commit # => v1.0.0 on @latest [1]
| \
|  * fix first fix on beta                # => v1.0.1-beta.1 on @beta [2]
|  * feat: first feat on beta             # => v1.1.0-beta.1 on @beta [3]
|  * fix: second fix on beta              # => v1.1.0-beta.2 on @beta [4]
|  * feat: second feat on beta            # => v1.1.0-beta.3 on @beta [5]
*  | fix: a fix on master # => v1.0.1 on @latest [6]
*  |  | Merge branch beta into master # => v1.1.0 on @latest [7]
```

### 1. Initial version

We'll start by making the first commit of the project, when pushing that commit on master, **semantic-release** will release the version `1.0.0` on the `@latest` dist-tag.

### 2. First fix on beta

We now decided to work on a new future pre-release fix for our product. We create the branch `beta` from the branch `master` and commit our fix (`fix first fix on beta`), **semantic-release** will publish the pre-release version `1.0.1-beta.1` on the dist-tag `@beta`.

### 3. First feature on beta

We've been asked to a add a new feature to out future release, so we've added a new commit
with the message `feat: first feat on beta` to the `beta` branch.

Since this `feat` commit introduces a higher change impact than the fix in step #2 (`feat` semantic release need to update the version to be a minor version instead of a patch one.

**semantic-release** will publish the pre-release version `1.1.0-beta.1` on the dist-tag `@beta`.

### 4. Second fix on beta

We found a bug in our pre-release so we've added the commit `fix: second fix on beta` to the pre-release channel. Now there is no higher impact on the branch (still `minor` release) so only the version identifier (`beta.1`) is to be increased.

**semantic-release** will publish the pre-release version `1.1.0-beta.2` on the dist-tag `@beta`.

### 5. Second feature on beta

We've added another feature to the `beta` branch, **semantic-release** will publish the pre-release version `1.1.0-beta.3` on the dist-tag `@beta`.

### 6. First fix on the default channel

Alongside our work on `beta`, a bug was found on the `master` branch and was fixed with `fix: a fix on master`, **semantic-release** will publish version `1.0.1` on the dist-tag `@latest`.

### 7. Publishing the 1.1.0 beta release to the default distribution channel

Once we've developed and pushed all the feature we want to include in the future version `1.1.0` in the `beta` branch and all our tests are successful we can release it to our users.

To do so we need to merge our changes made on `beta` into `master`. As `beta` and `master` branches have diverged, this merge might require to resolve conflicts.

Once the conflicts are resolved and the merge commit is pushed to master, semantic-release will release the version `1.1.0` on the dist-tag `@latest`.

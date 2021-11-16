# Publishing maintenance releases

This recipe will walk you through a simple example that uses Git branches and distribution channels to publish fixes and features for old versions of a package.

This example uses the **semantic-release** default configuration:
- [branches](../../usage/configuration.md#branches): `['+([0-9])?(.{+([0-9]),x}).x', 'master', 'next', 'next-major', {name: 'beta', prerelease: true}, {name: 'alpha', prerelease: true}]`
- [plugins](../../usage/configuration.md#plugins): `['@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator', '@semantic-release/npm', '@semantic-release/github']`

## Initial release

We'll start by making the first commit of the project, with the code for the initial release and the message `feat: initial commit`. When pushing that commit, on `master` **semantic-release** will release the version `1.0.0` and make it available on the default distribution channel which is the dist-tag `@latest` for npm.

The Git history of the repository is:

```
* feat: initial commit # => v1.0.0 on @latest
```

## Releasing a breaking change

We now decide to drop Node.js 6 support for our package, and require Node.js 8 or higher, which is a breaking change.

We commit that change with the message `feat: drop Node.js 6 support \n\n BREAKING CHANGE: Node.js >= 8 required` to `master`. When pushing that commit, **semantic-release** will release the version `2.0.0` on the dist-tag `@latest`.

The Git history of the repository is now:

```
* feat: initial commit # => v1.0.0 on @latest
* feat: drop Node.js 6 support \n\n BREAKING CHANGE: Node.js >= 8 required # => v2.0.0 on @latest
```

## Releasing a feature for version 1.x users

One of our users request a new feature, however they cannot migrate to Node.js 8 or higher due to corporate policies.

If we were to push that feature on `master` and release it, the new version would require Node.js 8 or higher as the release would also contain the commit `feat: drop Node.js 6 support \n\n BREAKING CHANGE: Node.js >= 8 required`.

Instead, we create the branch `1.x` from the tag `v1.0.0` with the command `git checkout -b 1.x v1.0.0` and we commit that feature with the message `feat: a feature` to the branch `1.x`. When pushing that commit, **semantic-release** will release the version `1.1.0` on the dist-tag `@release-1.x` so users who can't migrate to Node.js 8 or higher can benefit from it.

The Git history of the repository is now:

```
* feat: initial commit # => v1.0.0 on @latest
| \
*  | feat: drop Node.js 6 support \n\n BREAKING CHANGE: Node.js >= 8 required # => v2.0.0 on @latest
|  * feat: a feature # => v1.1.0 on @1.x
```

## Releasing a bug fix for version 1.0.x users

Another user currently using version `1.0.0` reports a bug. They cannot migrate to Node.js 8 or higher and they also cannot migrate to `1.1.0` as they do not use the feature developed in `feat: a feature` and their corporate policies require to go through a costly quality assurance process for each `minor` upgrades.

In order to deliver the bug fix in a `patch` release, we create the branch `1.0.x` from the tag `v1.0.0` with the command `git checkout -b 1.0.x v1.0.0` and we commit that fix with the message `fix: a fix` to the branch `1.0.x`. When pushing that commit, **semantic-release** will release the version `1.0.1` on the dist-tag `@release-1.0.x` so users who can't migrate to `1.1.x` or `2.x` can benefit from it.

The Git history of the repository is now:

```
* feat: initial commit # => v1.0.0 on @latest
| \
*  | feat: drop Node.js 6 support \n\n BREAKING CHANGE: Node.js >= 8 required # => v2.0.0 on @latest
|  | \
|  *  | feat: a feature # => v1.1.0 on @1.x
|  |  * fix: a fix # => v1.0.1 on @1.0.x
```

## Porting a bug fix from 1.0.x to 1.x

Now that we have released a fix in version `1.0.1` we want to make it available to `1.1.x` users as well.

To do so we need to merge the changes made on `1.0.x` (the commit `fix: a fix`) into the `1.x` branch. As `1.0.x` and `1.x` branches have diverged, this merge might require to resolve conflicts.

Once the conflicts are resolved and the merge commit is pushed to the branch `1.x`, **semantic-release** will release the version `1.1.1` on the dist-tag `@release-1.x` which contains both our feature and bug fix.

The Git history of the repository is now:

```
* feat: initial commit # => v1.0.0 on @latest
| \
*  | feat: drop Node.js 6 support \n\n BREAKING CHANGE: Node.js >= 8 required # => v2.0.0 on @latest
|  | \
|  *  | feat: a feature # => v1.1.0 on @1.x
|  |  * fix: a fix # => v1.0.1 on @1.0.x
|  | /|
|  *  | Merge branch 1.0.x into 1.x # => v1.1.1 on @1.x
```

## Porting bug fixes and features to master

Finally we want to make both our feature and bug fix available to users using the `@latest` dist-tag.

To do so we need to merge the changes made on `1.x` (the commits `feat: a feature` and `fix: a fix`) into `master`. As `1.x` and `master` branches have diverged, this merge might require to resolve conflicts.

Once the conflicts are resolved and the merge commit is pushed to `master`, **semantic-release** will release the version `2.1.0` on the dist-tag `@latest` which now contains the breaking change feature, the feature and the bug fix.

The Git history of the repository is now:

```
* feat: initial commit # => v1.0.0 on @latest
| \
*  | feat: drop Node.js 6 support \n\n BREAKING CHANGE: Node.js >= 8 required # => v2.0.0 on @latest
|  | \
|  *  | feat: a feature # => v1.1.0 on @1.x
|  |  * fix: a fix # => v1.0.1 on @1.0.x
|  | /|
|  *  | Merge branch 1.0.x into 1.x # => v1.1.1 on @1.x
| /|  |
*  |  | Merge branch 1.x into master # => v2.1.0 on @latest
```

## Releasing a bug fix for version 2.1.0 users

One of our users using the version `2.1.0` version reports a bug.

We can simply commit the bug fix with the message `fix: another fix` to `master`. When pushing that commit, **semantic-release** will release the version `2.1.1` on the dist-tag `@latest`.

The Git history of the repository is now:

```
* feat: initial commit # => v1.0.0 on @latest
| \
*  | feat: drop Node.js 6 support \n\n BREAKING CHANGE: Node.js >= 8 required # => v2.0.0 on @latest
|  | \
|  *  | feat: a feature # => v1.1.0 on @1.x
|  |  * fix: a fix # => v1.0.1 on @1.0.x
|  | /|
|  *  | Merge branch 1.0.x into 1.x # => v1.1.1 on @1.x
| /|  |
*  |  | Merge branch 1.x into master # => v2.1.0 on @latest
*  |  | fix: another fix # => v2.1.1 on @latest
```

## Porting a bug fix from master to 1.x

The bug fix `fix: another fix` also affects version `1.1.1` users, so we want to port it to the `1.x` branch.

To do so we need to cherry pick our fix commit made on `master` (`fix: another fix`) into `1.x` with `git checkout 1.x && git cherry-pick <sha of fix: another fix>`. As `master` and `1.x` branches have diverged, the cherry picking might require to resolve conflicts.

Once the conflicts are resolved and the commit is pushed to `1.x`, **semantic-release** will release the version `1.1.2` on the dist-tag `@release-1.x` which contains `feat: a feature`, `fix: a fix` and `fix: another fix` but not `feat: drop Node.js 6 support \n\n BREAKING CHANGE: Node.js >= 8 required`.

The Git history of the repository is now:

```
* feat: initial commit # => v1.0.0 on @latest
| \
*  | feat: drop Node.js 6 support \n\n BREAKING CHANGE: Node.js >= 8 required # => v2.0.0 on @latest
|  | \
|  *  | feat: a feature # => v1.1.0 on @1.x
|  |  * fix: a fix # => v1.0.1 on @1.0.x
|  | /|
|  *  | Merge branch 1.0.x into 1.x # => v1.1.1 on @1.x
| /|  |
*  |  | Merge branch 1.x into master # => v2.1.0 on @latest
*  |  | fix: another fix # => v2.1.1 on @latest
|  |  |
|  *  | fix: another fix # => v1.1.2 on @1.x
```

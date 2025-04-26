# Troubleshooting

## You do not have permission to publish 'package-name'

When running semantic-release you might encounter the following error:

```bash
npm ERR! publish Failed PUT 403
npm ERR! code E403
npm ERR! You do not have permission to publish "<package-name>". Are you logged in as the correct user? : <package-name>
```

This is most likely related to a misconfiguration of the [npm registry authentication](https://github.com/semantic-release/npm#npm-registry-authentication) or to your user [missing permission](https://docs.npmjs.com/cli/team) for publishing.

It might also happen if the package name you are trying to publish already exists (in the case of npm, you may be trying to publish a new version of a package that is not yours, hence the permission error).

To verify if your package name is available you can use [npm-name-cli](https://github.com/sindresorhus/npm-name-cli):

```bash
$ npm install --global npm-name-cli
$ npm-name <package-name>
```

If the package name is not available, change it in your `package.json` or consider using an [npm scope](https://docs.npmjs.com/misc/scope).

## Squashed commits are ignored by **semantic-release**

**semantic-release** parses commits according to a [commit message convention](https://github.com/semantic-release/semantic-release#commit-message-format) to figure out how they affect the codebase. Commits that doesn't follow the project's commit message convention are simply ignored.

When [squashing commits](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History#_squashing) most Git tools will by default generate a new commit message with a summary of the squashed commits. This commit message will most likely not be compliant with the project's commit message convention and therefore will be ignored by **semantic-release**.

When squashing commits make sure to rewrite the resulting commit message to be compliant with the project's commit message convention.

**Note**: if the resulting squashed commit encompasses multiple changes (for example multiple unrelated features or fixes) then it's probably not a good idea to squash those commits together. A commit should contain exactly one self-contained functional change and a functional change should be contained in exactly one commit. See [atomic commits](https://en.wikipedia.org/wiki/Atomic_commit).

## `reference already exists` error when pushing tag

**semantic-release** read [Git tags](https://git-scm.com/book/en/v2/Git-Basics-Tagging) that are present in the history of your release branch in order to determine the last release published. Then it determines the next version to release based on the commits pushed since then and create the corresponding tag.
If a tag with the name already in your repository, Git will throw and error as tags must be unique across the repository.
This situation happens when you have a version tag identical to the new one **semantic-release** is trying to create that is not in the history of the current branch.

If an actual release with that version number was published you need to merge all the commits up to that release into your release branch.

If there is no published release with that version number, the tag must be deleted.

```bash
# Verify if the commit exists in the repository
$ git rev-list -1 <tag name>
# If a commit sha is returned, then the tag exists

# Verify the branches having the tagged commit in their history
$ git branch --contains <tag name>

# Delete the tag
$ git tag -d <tag name>
$ git push origin :refs/tags/<tag name>
```

## release not found release branch after `git push --force`

**semantic-release** is using both [git tags](https://git-scm.com/docs/git-tag) and [git notes](https://git-scm.com/docs/git-notes) to store information about which releases happened in which branch.

After a git history rewrite due to a `git push --force`, the git tags and notes referencing the commits that were rewritten are lost.

To recover from that situation, do the following:

1. Delete the tag(s) for the release(s) that have been lost from the git history. You can delete each tag from remote using `git push origin -d :[TAG NAME]`, e.g. `git push origin -d :v2.0.0-beta.1`. You can delete tags locally using `git tag -d [TAG NAME]`, e.g. `git tag -d v2.0.0-beta.1`.
2. Re-create the tags locally: `git tag [TAG NAME] [COMMIT HASH]`, where `[COMMIT HASH]` is the new commit that created the release for the lost tag. E.g. `git tag v2.0.0-beta.1 abcdef0`
3. Re-create the git notes for each release tag, e.g. `git notes --ref semantic-release add -f -m '{"channels":["beta"]}' v2.0.0-beta.1`. If the release was also published in the default channel (usually `master`/`main`), then set the first channel to `null`, e.g. `git notes --ref semantic-release add -f -m '{"channels":[null, "beta"]}'`
4. Push the local notes: `git push --force origin refs/notes/semantic-release`. The `--force` is needed after the rebase. Be careful.

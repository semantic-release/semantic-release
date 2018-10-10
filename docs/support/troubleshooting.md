# Troubleshooting

## You do not have permission to publish 'package-name'

When running semantic-release you might encounter the following error:

```bash
npm ERR! publish Failed PUT 403
npm ERR! code E403
npm ERR! You do not have permission to publish "<package-name>". Are you logged in as the correct user? : <package-name>
```

This is most likely related to a misconfiguration of the [npm registry authentication](https://github.com/semantic-release/npm#npm-registry-authentication) or to your user [missing permission](https://docs.npmjs.com/cli/team) for publishing.

It might also happen if the package name you are trying to publish already exists (in such case npm consider you are trying to publish a new version of a package that is not yours, hence the permission error).

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

**Note**: if the resulting squashed commit would encompasses multiple changes (for example multiple unrelated features or fixes) then it's probably not a good idea to squash those commits together. A commit should contain exactly one self-contained functional change and a functional change should be contained in exactly one commit. See [atomic commits](https://en.wikipedia.org/wiki/Atomic_commit).

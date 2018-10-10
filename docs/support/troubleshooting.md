# Troubleshooting

## You do not have permission to publish 'package-name'

When running semantic-release you may encounter the following error:

```
An error occurred while running semantic-release: { Error: Command failed: npm publish ./. --registry https://registry.npmjs.org/
npm ERR! publish Failed PUT 403
npm ERR! code E403
npm ERR! You do not have permission to publish "<package-name>". Are you logged in as the correct user? : <package-name>
```

This message is a little unclear, and might not have anything to with your `NPM_TOKEN` or authentication method. It might instead be related to the package name itself. If there is already a package with the same name as yours or, there is a very close match, it could trigger this error.

Best way to be sure, is to search [npmjs.org](https://www.npmjs.com/)) using your package name. If there is a name conflict, rename your package in your `package.json`

## Squashed commits are ignored by **semantic-release**

**semantic-release** parses commits according to a [commit message convention](https://github.com/semantic-release/semantic-release#commit-message-format) to figure out how they affect the codebase. Commits that doesn't follow the project's commit message convention are simply ignored.

When [squashing commits](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History#_squashing) most Git tools will by default generate a new commit message with a summary of the squashed commits. This commit message will most likely not be compliant with the project's commit message convention and therefore will be ignored by **semantic-release**.

When squashing commits make sure to rewrite the resulting commit message to be compliant with the project's commit message convention.

**Note**: if the resulting squashed commit would encompasses multiple changes (for example multiple unrelated features or fixes) then it's probably not a good idea to squash those commits together. A commit should contain exactly one self-contained functional change and a functional change should be contained in exactly one commit. See [atomic commits](https://en.wikipedia.org/wiki/Atomic_commit).

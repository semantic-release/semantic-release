# Troubleshooting

## ENOTINHISTORY Commit not in history

This error happens when the commit associated with the last release cannot be found in the branch history.

Multiple situation can cause this issue:
- The package name configured in your `package.json` already exists and **semantic-release** obtains the last release of that package, which is unrelated to yours
- The commit history has been rewritten since the last release (with `git rebase` and `git push -f`)

If the package name configured in your `package.json` already exits, you should change it, and commit the `package.json`. Then **semantic-release** will proceed normally and make the initial release.

If you can identify the commit in your branch history that should be associated with the release version mentioned in the error message you can recover by tagging this commit:

```bash
$ git tag -f v<version of the last release> <commit sha1 corresponding to last release>
$ git push -f --tags origin <your release branch>
```

## ENOGITHEAD There is no commit associated with last release

This error happens when there is no commit associated with the last release that can be found in the package metadata on the npm registry.

This usually happen when the last release has been made without access to the git repository informations.

You can recover from that issue by identifying the commit in your branch history that should have been associated with the release version mentioned in the error message and tagging this commit:

```bash
$ git tag -f v<version of the last release> <commit sha1 corresponding to last release>
$ git push -f --tags origin <your release branch>
```

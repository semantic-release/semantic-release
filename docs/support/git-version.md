# Git version requirement

**semantic-release** uses Git CLI commands to read information about the repository such as branches, commit history and tags.
Certain commands and options (such as [the `--merged` option of the `git tag` command](https://git-scm.com/docs/git-tag/2.7.0#git-tag---no-mergedltcommitgt) or bug fixes related to `git ls-files`) used by **semantic-release** are only available in Git version 2.7.1 and higher.

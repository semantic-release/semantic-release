<a name="1.0.19"></a>
## 1.0.19 (2016-07-12)


### Bug Fixes

* errors in bin do not result in non-zero exit ([84b66e4](https://github.com/atlassian/lerna-semantic-release/commit/84b66e4))
* **isRelevant:** fix is relevant detection for packages that are substrings of other ones ([240ed60](https://github.com/atlassian/lerna-semantic-release/commit/240ed60))
* **logs:** change to verbose logging ([d7f928c](https://github.com/atlassian/lerna-semantic-release/commit/d7f928c))
* **package:** Not all files were published correctly ([4fc2cc4](https://github.com/atlassian/lerna-semantic-release/commit/4fc2cc4))
* **pre:** use branch asked for ([ee43e3b](https://github.com/atlassian/lerna-semantic-release/commit/ee43e3b))
* pass flags before remote ([502a6b7](https://github.com/atlassian/lerna-semantic-release/commit/502a6b7))
* pull tags before pushing them ([c707192](https://github.com/atlassian/lerna-semantic-release/commit/c707192))
* work w/o callback and specify default one ([10dd41b](https://github.com/atlassian/lerna-semantic-release/commit/10dd41b))
* **test:** test fix to make sure release process is working ([47a758e](https://github.com/atlassian/lerna-semantic-release/commit/47a758e))


### Code Refactoring

* **package:** manually bump the version to 2.0.0 ([f452b24](https://github.com/atlassian/lerna-semantic-release/commit/f452b24))


### Features

* merge before push ([e504f09](https://github.com/atlassian/lerna-semantic-release/commit/e504f09))


### BREAKING CHANGES

* package: lerna-semantic-release is now run with pre/perform/post commands




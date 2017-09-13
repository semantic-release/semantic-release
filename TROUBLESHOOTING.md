# Troubleshooting semantic-release

### ENOTINHISTORY Commit not in history

```
semantic-release ERR! commits The commit the last release of this package was derived from is not in the direct history of the "master" branch.
semantic-release ERR! commits This means semantic-release can not extract the commits between now and then.
semantic-release ERR! commits This is usually caused by force pushing, releasing from an unrelated branch, or using an already existing package name.
semantic-release ERR! commits You can recover from this error by publishing manually or restoring the commit "123".
semantic-release ERR! pre Failed to determine new version.
semantic-release ERR! pre ENOTINHISTORY Commit not in history
```

To restore semantic-release, follow these steps:

```
git pull
git reset --hard origin/master
npm version x.y.z # check your current version and set this based on semver rules manually

# if you have a PR workflow, create a new branch, otherwise commit to master

git checkout -B chore/release
git commit -am 'chore: release'
git push

# merge (not squash-merge) on github (this is important before running git push). This is only required when you work with branches
git checkout master

# definitely required
git pull
git push --tags
npm publish
```

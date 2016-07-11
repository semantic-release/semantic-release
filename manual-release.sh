#!/usr/bin/env bash
set -x -e

LERNA=./node_modules/.bin/lerna
$LERNA --version # will fail the script if lerna is the wrong version
$LERNA exec -- echo 'testing to make sure lerna is installed correctly'

PKG=$1
RELATIVE_PKG=packages/$PKG
VERSION_TYPE=$2

[ -z $PKG ] && echo "need to set package" && exit 1
[ -z $NPM_TOKEN] && echo "need to set NPM_TOKEN" && exit 1
[ -z $VERSION_TYPE] && echo "need to set VERSION_TYPE" && exit 1

git fetch
git pull

pushd $RELATIVE_PKG
npm version $VERSION_TYPE --no-git-tag-version
VERSION=$(node -e "console.log(require('./package.json').version)")
popd

git commit -am"chore(release): manual bump for release of $PKG@$VERSION"
git tag $PKG@$VERSION

$LERNA exec -- ln -sf ../../.git .git
npm publish packages/$PKG
$LERNA exec -- unlink .git

git push
git push --tags

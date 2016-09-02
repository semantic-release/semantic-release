#!/bin/bash
set -e

if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
  echo "We are in a pull request, not setting up release"
  exit 0
fi

if [[ $TRAVIS_BRANCH == 'caribou' ]]; then
  rm -rf .git
  git init
  git clean -dfx
  git remote add origin https://github.com/atlassian/lerna-semantic-release.git
  git fetch origin
  git clone https://github.com/$TRAVIS_REPO_SLUG.git $TRAVIS_REPO_SLUG
  git checkout $TRAVIS_BRANCH

  git config credential.helper store
  echo "https://lerna-sr-travis-ci:${RELEASE_GH_TOKEN}@github.com/atlassian/lerna-semantic-release.git" > ~/.git-credentials

  npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN -q
  npm prune

  git config --global user.email "jonelson+lerna-sr-travis-ci@atlassian.com"
  git config --global user.name "Joshua Nelson"
  git config --global push.default simple

  # git remote set-url origin "https://github.com/atlassian/lerna-semantic-release.git"
  # git fetch --unshallow
  git fetch --tags
  git branch -u origin/$TRAVIS_BRANCH
  git fsck --full #debug
  #git tag --list #debug
  npm whoami #debug
fi

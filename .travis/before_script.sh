#!/bin/bash
set -e

if [[ $TRAVIS_BRANCH == 'caribou' ]]
  npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN -q
  npm prune
  git config --global user.email "jonelson+lerna-sr-travis-ci@atlassian.com"
  git config --global user.name "Joshua Nelson"
  git config --global push.default simple
  git remote rm origin
  git remote add origin https://lerna-sr-travis-ci:${RELEASE_GH_TOKEN}@github.com/atlassian/lerna-semantic-release.git
  git checkout $TRAVIS_BRANCH #Travis CI starts in a detached state, need to set up so we're on a branch that can push to the remote
  git fetch
  git branch -u origin/$TRAVIS_BRANCH
  npm whoami #debug
fi

#!/bin/bash
set -e

if [[ $TRAVIS_BRANCH == 'caribou' ]]
  npm run semantic-release
fi

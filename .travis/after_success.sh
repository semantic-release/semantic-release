#!/bin/bash
set -e

if [[ $TRAVIS_BRANCH == 'caribou' ]]; then
  npm run semantic-release
fi

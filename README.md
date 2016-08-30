# lerna-semantic-release

Status:
[![npm version](https://img.shields.io/npm/v/lerna-semantic-release.svg?style=flat-square)](https://www.npmjs.org/package/lerna-semantic-release)
[![npm downloads](https://img.shields.io/npm/dm/lerna-semantic-release.svg?style=flat-square)](http://npm-stat.com/charts.html?package=lerna-semantic-release)
[![Build Status](https://img.shields.io/travis/atlassian/lerna-semantic-release.svg?style=flat-square)](https://travis-ci.org/atlassian/lerna-semantic-release)


[semantic-release](https://www.npmjs.com/package/semantic-release) for [lerna](http://lernajs.io)-based projects.

Basically a semantic-release that orders commits based on which package they belong to (uses data from [cz-lerna-changelog](https://github.com/atlassian/cz-lerna-changelog)) and then determines on that what the next release should be.

## Setup

Install cz-lerna-changelog in your repository:

```
npm install commitizen -g
```

Next, initialize your project to use the cz-lerna-changelog adapter by typing:

```
commitizen init cz-lerna-changelog --save-dev --save-exact
```

See the [commitzien-cli](https://github.com/commitizen/cz-cli) docs for more details on how to set up commitzen with the correct adapter.

### Setting up the build

You'll need to set up your build in such a way that tags and commits can be pushed back to the repository. This is so that lerna can stay in sync with the NPM releases.

You'll also need to set the `NPM_TOKEN` environment variable so that npm can run `npm publish` on your components.

## Releasing

Execute these commands in your release process:

```
# Pre
lerna-semantic-release pre # Set up the versions, tags and commits

# Perform
lerna-semantic-release perform # Publishes to npm

# Post
lerna-semantic-release post # Generates a changelog in each package in a file named CHANGELOG.md - will not commit or push that file any more after version 7.0.5 any more. If you want to do something with it, you will need to do this manually.

This will publish all npm packages, including creating commits and tags for each release, in the format that lerna expects for the `lerna updated` command.

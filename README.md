# lerna-semantic-release

Status:
[![npm version](https://img.shields.io/npm/v/lerna-semantic-release.svg?style=flat-square)](https://www.npmjs.org/package/lerna-semantic-release)
[![npm downloads](https://img.shields.io/npm/dm/lerna-semantic-release.svg?style=flat-square)](http://npm-stat.com/charts.html?package=lerna-semantic-release)
[![Build Status](https://img.shields.io/travis/atlassian/lerna-semantic-release.svg?style=flat-square)](https://travis-ci.org/atlassian/lerna-semantic-release)


[semantic-release](https://www.npmjs.com/package/semantic-release) for [lerna](http://lernajs.io)-based projects.

Basically a semantic-release that orders commits based on which package they belong to (uses data from [cz-lerna-changelog](https://github.com/atlassian/cz-lerna-changelog)) and then determines on that what the next release should be.

## Setup

Each lerna package should have a `pre-release` script in their `package.json`

```
{
  "name": "component",
  "version": "0.0.0",
  "scripts": {
    "pre-release": "lerna-semantic-release pre"
  },
}
```

## Releasing

Execute these commands in your release process:

```
lerna run pre-release --concurrency 1 #We must run this is a pre-release step in each package. Concurrency 1 is necessary due to git operations
lerna-semantic-release perform
```

This will publish all npm packages, including creating commits and tags for each release, in the format that lerna expects for the `lerna updated` command.
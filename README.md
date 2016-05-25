# lerna-semantic-release

Status:
[![npm version](https://img.shields.io/npm/v/lerna-semantic-release.svg?style=flat-square)](https://www.npmjs.org/package/lerna-semantic-release)
[![npm downloads](https://img.shields.io/npm/dm/lerna-semantic-release.svg?style=flat-square)](http://npm-stat.com/charts.html?package=lerna-semantic-release)
[![Build Status](https://img.shields.io/travis/atlassian/lerna-semantic-release.svg?style=flat-square)](https://travis-ci.org/atlassian/lerna-semantic-release)


[semantic-release](https://www.npmjs.com/package/semantic-release) for [lerna](http://lernajs.io)-based projects.

Basically a semantic-release that orders commits based on which package they belong to (uses data from [cz-lerna-changelog](https://github.com/atlassian/cz-lerna-changelog)) and then determines on that what the next release should be.

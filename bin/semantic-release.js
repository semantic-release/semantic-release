#!/usr/bin/env node

// Bad news: We have to write plain ES5 in this file
// Good news: It's the only file of the entire project

/* eslint-disable no-var */

var semver = require('semver');
var pkg = require('../package.json');

if (!semver.satisfies(process.version, pkg.engines.node)) {
  console.error(
    `[semantic-release]: node version ${pkg.engines.node} is required. Found ${process.version}.

See https://github.com/semantic-release/semantic-release/blob/caribou/docs/support/node-version.md for more details and solutions.`
  );
  process.exit(1);
}

// Node 8+ from this point on
require('../cli')().catch(() => {
  process.exitCode = 1;
});

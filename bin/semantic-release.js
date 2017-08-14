#!/usr/bin/env node

// Bad news: We have to write plain ES5 in this file
// Good news: It's the only file of the entire project

var semver = require('semver')

if (semver.lt(process.version, '8.0.0')) {
  console.error(
`semantic-release: node version >= 8 is required. Found ${process.version}.

If this error appears on a build job that is not your build leader, you can
safely ignore it. On Travis CI the build leader is the first job in the build
matrix.

Only a single job in your entire build-matrix needs to run on node 8. All others
may safely fail with this message. If you don't have node 8 in your build
matrix "npx" allows to restore compatibility with minimal overhead.

$ npx -p node@8 npm run semantic-release

npx is bundled with npm >= 5.4, or available via npm. More info: npm.im/npx`)
  process.exit(1)
}

// node 8+ from this point on
require('../src')

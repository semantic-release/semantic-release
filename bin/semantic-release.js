#!/usr/bin/env node

// Bad news: We have to write plain ES5 in this file
// Good news: It's the only file of the entire project

// eslint-disable-next-line no-var
var semver = require('semver');

if (semver.lt(process.version, '8.0.0')) {
  console.error(
    `semantic-release: node version >= 8 is required. Found ${process.version}.

If there is another job running on node version >= 8, it will be picked as
the build leader and you can safely ignore this message.

If you don't have node 8 in your build matrix you can use "npx" to restore
compatibility with minimal overhead:

$ npx -p node@8 npm run semantic-release

npx is bundled with npm >= 5.4, or available via npm. More info: npm.im/npx`
  );
  process.exit(1);
}

// Node 8+ from this point on
require('../cli')().catch(() => {
  process.exitCode = 1;
});

#!/usr/bin/env node// Bad news: We have to write plain ES5 in this file
import semver from 'semver';

import execa from 'execa';
import findVersions from 'find-versions';
import pkg from '../package.json';

const MIN_GIT_VERSION = '2.7.1';

if (!semver.satisfies(process.version, pkg.engines.node)) {
  console.error(
    `[semantic-release]: node version ${pkg.engines.node} is required. Found ${process.version}.

See https://github.com/semantic-release/semantic-release/blob/master/docs/support/node-version.md for more details and solutions.`
  );
  process.exit(1);
}

execa('git', ['--version'])
  .then(({stdout}) => {
    const gitVersion = findVersions(stdout)[0];
    if (semver.lt(gitVersion, MIN_GIT_VERSION)) {
      console.error(`[semantic-release]: Git version ${MIN_GIT_VERSION} is required. Found ${gitVersion}.`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error(`[semantic-release]: Git version ${MIN_GIT_VERSION} is required. No git binary found.`);
    console.error(error);
    process.exit(1);
  });

// Node 10+ from this point on
require('../cli')()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

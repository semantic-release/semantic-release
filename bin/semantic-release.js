#!/usr/bin/env node

/* eslint-disable no-var */

import semver from "semver";
import { execa } from "execa";
import findVersions from "find-versions";
import cli from "../cli.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { engines } = require("../package.json");
const { satisfies, lt } = semver;

const MIN_GIT_VERSION = "2.7.1";

if (!satisfies(process.version, engines.node)) {
  console.error(
    `[semantic-release]: node version ${engines.node} is required. Found ${process.version}.

See https://github.com/semantic-release/semantic-release/blob/master/docs/support/node-version.md for more details and solutions.`
  );
  process.exit(1);
}

execa("git", ["--version"])
  .then(({ stdout }) => {
    const gitVersion = findVersions(stdout, { loose: true })[0];
    if (lt(gitVersion, MIN_GIT_VERSION)) {
      console.error(`[semantic-release]: Git version ${MIN_GIT_VERSION} is required. Found ${gitVersion}.`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error(`[semantic-release]: Git version ${MIN_GIT_VERSION} is required. No git binary found.`);
    console.error(error);
    process.exit(1);
  });

cli()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

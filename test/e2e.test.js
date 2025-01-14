import path from "node:path";
import { setTimeout } from "node:timers/promises";
import test from "ava";
import * as td from "testdouble";
import { escapeRegExp } from "lodash-es";
import fsExtra from "fs-extra";
import { execa } from "execa";
import { WritableStreamBuffer } from "stream-buffers";

import getAuthUrl from "../lib/get-git-auth-url.js";
import { SECRET_REPLACEMENT } from "../lib/definitions/constants.js";
import {
  gitCheckout,
  gitCommits,
  gitGetNote,
  gitHead,
  gitPush,
  gitRemoteTagHead,
  gitRepo,
  gitTagHead,
  merge,
} from "./helpers/git-utils.js";
import { npmView } from "./helpers/npm-utils.js";
import * as gitbox from "./helpers/gitbox.js";
import * as mockServer from "./helpers/mockserver.js";
import * as npmRegistry from "./helpers/npm-registry.js";

const { readJson, writeJson } = fsExtra;

/* eslint camelcase: ["error", {properties: "never"}] */

// Environment variables used with semantic-release cli (similar to what a user would setup)
const { GITHUB_ACTION, GITHUB_ACTIONS, GITHUB_TOKEN, ...processEnvWithoutGitHubActionsVariables } = process.env;
let env;

// Environment variables used only for the local npm command used to do verification
const npmTestEnv = {
  ...processEnvWithoutGitHubActionsVariables,
  ...npmRegistry.authEnv(),
  npm_config_registry: npmRegistry.url,
};

const cli = path.resolve("./bin/semantic-release.js");
const pluginError = path.resolve("./test/fixtures/plugin-error");
const pluginInheritedError = path.resolve("./test/fixtures/plugin-error-inherited");
const pluginLogEnv = path.resolve("./test/fixtures/plugin-log-env");
const pluginEsmNamedExports = path.resolve("./test/fixtures/plugin-esm-named-exports");

test.before(async () => {
  await Promise.all([gitbox.pull(), npmRegistry.pull(), mockServer.pull()]);
  await Promise.all([gitbox.start(), npmRegistry.start(), mockServer.start()]);

  env = {
    ...processEnvWithoutGitHubActionsVariables,
    ...npmRegistry.authEnv(),
    CI: "true",
    GH_TOKEN: gitbox.gitCredential,
    TRAVIS: "true",
    TRAVIS_BRANCH: "master",
    TRAVIS_PULL_REQUEST: "false",
    GITHUB_API_URL: mockServer.url,
  };
});

test.after.always(async () => {
  await Promise.all([gitbox.stop(), npmRegistry.stop(), mockServer.stop()]);
});

test.serial("Release patch, minor and major versions", async (t) => {
  const packageName = "test-release";
  const owner = "git";
  // Create a git repository, set the current working directory at the root of the repo
  t.log("Create git repository and package.json");
  const { cwd, repositoryUrl, authUrl } = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson(path.resolve(cwd, "package.json"), {
    name: packageName,
    version: "0.0.0-dev",
    repository: { url: repositoryUrl },
    publishConfig: { registry: npmRegistry.url },
    release: { branches: ["master", "next"], success: false, fail: false },
  });
  // Create a npm-shrinkwrap.json file
  await execa("npm", ["shrinkwrap"], { env: npmTestEnv, cwd, extendEnv: false });

  /* No release */
  let verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    { headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }] },
    { body: { permissions: { push: true }, clone_url: repositoryUrl }, method: "GET" }
  );
  t.log("Commit a chore");
  await gitCommits(["chore: Init repository"], { cwd });
  t.log("$ semantic-release");
  let { stdout, exitCode } = await execa(cli, [], { env, cwd, extendEnv: false });
  t.regex(stdout, /There are no relevant changes, so no new version is released/);
  t.is(exitCode, 0);

  /* Initial release */
  let version = "1.0.0";
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    { headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }] },
    { body: { permissions: { push: true }, clone_url: repositoryUrl }, method: "GET" }
  );
  let createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: { tag_name: `v${version}`, name: `v${version}` },
      headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }],
    },
    { body: { html_url: `release-url/${version}` } }
  );

  t.log("Commit a feature");
  await gitCommits(["feat: Initial commit"], { cwd });
  t.log("$ semantic-release");
  ({ stdout, exitCode } = await execa(cli, [], { env, cwd, extendEnv: false }));
  t.regex(stdout, new RegExp(`Published GitHub release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(exitCode, 0);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson(path.resolve(cwd, "package.json"))).version, version);
  t.is((await readJson(path.resolve(cwd, "npm-shrinkwrap.json"))).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  let {
    "dist-tags": { latest: releasedVersion },
  } = await npmView(packageName, npmTestEnv);
  let head = await gitHead({ cwd });
  t.is(releasedVersion, version);
  t.is(await gitTagHead(`v${version}`, { cwd }), head);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`, { cwd }), head);
  t.log(`+ released ${releasedVersion}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createReleaseMock);

  /* Patch release */
  version = "1.0.1";
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    { headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }] },
    { body: { permissions: { push: true }, clone_url: repositoryUrl }, method: "GET" }
  );
  createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: { tag_name: `v${version}`, name: `v${version}` },
      headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }],
    },
    { body: { html_url: `release-url/${version}` } }
  );

  t.log("Commit a fix");
  await gitCommits(["fix: bar"], { cwd });
  t.log("$ semantic-release");
  ({ stdout, exitCode } = await execa(cli, [], { env, cwd, extendEnv: false }));
  t.regex(stdout, new RegExp(`Published GitHub release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(exitCode, 0);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson(path.resolve(cwd, "package.json"))).version, version);
  t.is((await readJson(path.resolve(cwd, "npm-shrinkwrap.json"))).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  ({
    "dist-tags": { latest: releasedVersion },
  } = await npmView(packageName, npmTestEnv));
  head = await gitHead({ cwd });
  t.is(releasedVersion, version);
  t.is(await gitTagHead(`v${version}`, { cwd }), head);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`, { cwd }), head);
  t.log(`+ released ${releasedVersion}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createReleaseMock);

  /* Minor release */
  version = "1.1.0";
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    { headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }] },
    { body: { permissions: { push: true }, clone_url: repositoryUrl }, method: "GET" }
  );
  createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: { tag_name: `v${version}`, name: `v${version}` },
      headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }],
    },
    { body: { html_url: `release-url/${version}` } }
  );

  t.log("Commit a feature");
  await gitCommits(["feat: baz"], { cwd });
  t.log("$ semantic-release");
  ({ stdout, exitCode } = await execa(cli, [], { env, cwd, extendEnv: false }));
  t.regex(stdout, new RegExp(`Published GitHub release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(exitCode, 0);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson(path.resolve(cwd, "package.json"))).version, version);
  t.is((await readJson(path.resolve(cwd, "npm-shrinkwrap.json"))).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  ({
    "dist-tags": { latest: releasedVersion },
  } = await npmView(packageName, npmTestEnv));
  head = await gitHead({ cwd });
  t.is(releasedVersion, version);
  t.is(await gitTagHead(`v${version}`, { cwd }), head);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`, { cwd }), head);
  t.log(`+ released ${releasedVersion}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createReleaseMock);

  /* Major release on next */
  version = "2.0.0";
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    { headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }] },
    { body: { permissions: { push: true }, clone_url: repositoryUrl }, method: "GET" }
  );
  createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: { tag_name: `v${version}`, name: `v${version}` },
      headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }],
    },
    { body: { html_url: `release-url/${version}` } }
  );

  t.log("Commit a breaking change on next");
  await gitCheckout("next", true, { cwd });
  await gitPush("origin", "next", { cwd });
  await gitCommits(["feat: foo\n\n BREAKING CHANGE: bar"], { cwd });
  t.log("$ semantic-release");
  ({ stdout, exitCode } = await execa(cli, [], { env: { ...env, TRAVIS_BRANCH: "next" }, cwd, extendEnv: false }));
  t.regex(stdout, new RegExp(`Published GitHub release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(exitCode, 0);

  // Verify package.json and npm-shrinkwrap.json have been updated
  t.is((await readJson(path.resolve(cwd, "package.json"))).version, version);
  t.is((await readJson(path.resolve(cwd, "npm-shrinkwrap.json"))).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  ({
    "dist-tags": { next: releasedVersion },
  } = await npmView(packageName, npmTestEnv));
  head = await gitHead({ cwd });
  t.is(releasedVersion, version);
  t.is(await gitGetNote(`v${version}`, { cwd }), '{"channels":["next"]}');
  t.is(await gitTagHead(`v${version}`, { cwd }), head);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`, { cwd }), head);
  t.log(`+ released ${releasedVersion} on @next`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createReleaseMock);

  /* Merge next into master */
  version = "2.0.0";
  const releaseId = 1;
  verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    { headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }] },
    { body: { permissions: { push: true }, clone_url: repositoryUrl }, method: "GET" }
  );
  const getReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases/tags/v2.0.0`,
    { headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }] },
    { body: { id: releaseId }, method: "GET" }
  );
  const updateReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases/${releaseId}`,
    {
      body: { name: `v${version}`, prerelease: false },
      headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }],
    },
    { body: { html_url: `release-url/${version}` }, method: "PATCH" }
  );

  t.log("Merge next into master");
  await gitCheckout("master", false, { cwd });
  await merge("next", { cwd });
  await gitPush("origin", "master", { cwd });
  t.log("$ semantic-release");
  ({ stdout, exitCode } = await execa(cli, [], { env, cwd, extendEnv: false }));
  t.regex(stdout, new RegExp(`Updated GitHub release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Adding version ${version} to npm registry on dist-tag latest`));
  t.is(exitCode, 0);

  // Wait for 3s as the change of dist-tag takes time to be reflected in the registry
  await setTimeout(3000);
  // Retrieve the published package from the registry and check version and gitHead
  ({
    "dist-tags": { latest: releasedVersion },
  } = await npmView(packageName, npmTestEnv));
  t.is(releasedVersion, version);
  t.is(await gitGetNote(`v${version}`, { cwd }), '{"channels":["next",null]}');
  t.is(await gitTagHead(`v${version}`, { cwd }), await gitTagHead(`v${version}`, { cwd }));
  t.is(
    await gitRemoteTagHead(authUrl, `v${version}`, { cwd }),
    await gitRemoteTagHead(authUrl, `v${version}`, { cwd })
  );
  t.log(`+ added ${releasedVersion}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(getReleaseMock);
  await mockServer.verify(updateReleaseMock);
});

test.serial("Exit with 1 if a plugin is not found", async (t) => {
  const packageName = "test-plugin-not-found";
  const owner = "test-repo";
  // Create a git repository, set the current working directory at the root of the repo
  t.log("Create git repository");
  const { cwd } = await gitRepo();
  await writeJson(path.resolve(cwd, "package.json"), {
    name: packageName,
    version: "0.0.0-dev",
    repository: { url: `git+https://github.com/${owner}/${packageName}` },
    release: { analyzeCommits: "non-existing-path", success: false, fail: false },
  });

  const { exitCode, stderr } = await t.throwsAsync(execa(cli, [], { env, cwd, extendEnv: false }));
  t.is(exitCode, 1);
  t.regex(stderr, /Cannot find module/);
});

test.serial("Exit with 1 if a shareable config is not found", async (t) => {
  const packageName = "test-config-not-found";
  const owner = "test-repo";
  // Create a git repository, set the current working directory at the root of the repo
  t.log("Create git repository");
  const { cwd } = await gitRepo();
  await writeJson(path.resolve(cwd, "package.json"), {
    name: packageName,
    version: "0.0.0-dev",
    repository: { url: `git+https://github.com/${owner}/${packageName}` },
    release: { extends: "non-existing-path", success: false, fail: false },
  });

  const { exitCode, stderr } = await t.throwsAsync(execa(cli, [], { env, cwd, extendEnv: false }));
  t.is(exitCode, 1);
  t.regex(stderr, /Cannot find module/);
});

test.serial("Exit with 1 if a shareable config reference a not found plugin", async (t) => {
  const packageName = "test-config-ref-not-found";
  const owner = "test-repo";
  const shareable = { analyzeCommits: "non-existing-path" };

  // Create a git repository, set the current working directory at the root of the repo
  t.log("Create git repository");
  const { cwd } = await gitRepo();
  await writeJson(path.resolve(cwd, "package.json"), {
    name: packageName,
    version: "0.0.0-dev",
    repository: { url: `git+https://github.com/${owner}/${packageName}` },
    release: { extends: "./shareable.json", success: false, fail: false },
  });
  await writeJson(path.resolve(cwd, "shareable.json"), shareable);

  const { exitCode, stderr } = await t.throwsAsync(execa(cli, [], { env, cwd, extendEnv: false }));
  t.is(exitCode, 1);
  t.regex(stderr, /Cannot find module/);
});

test.serial("Dry-run", async (t) => {
  const packageName = "test-dry-run";
  const owner = "git";
  // Create a git repository, set the current working directory at the root of the repo
  t.log("Create git repository and package.json");
  const { cwd, repositoryUrl } = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson(path.resolve(cwd, "package.json"), {
    name: packageName,
    version: "0.0.0-dev",
    repository: { url: repositoryUrl },
    publishConfig: { registry: npmRegistry.url },
    release: { success: false, fail: false },
  });

  /* Initial release */
  const verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    { headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }] },
    { body: { permissions: { push: true }, clone_url: repositoryUrl }, method: "GET" }
  );
  const version = "1.0.0";
  t.log("Commit a feature");
  await gitCommits(["feat: Initial commit"], { cwd });
  t.log("$ semantic-release -d");
  const { stdout, exitCode } = await execa(cli, ["-d"], { env, cwd, extendEnv: false });
  t.regex(stdout, new RegExp(`There is no previous release, the next release version is ${version}`));
  t.regex(stdout, new RegExp(`Release note for version ${version}`));
  t.regex(stdout, /Initial commit/);
  t.is(exitCode, 0);

  // Verify package.json and has not been modified
  t.is((await readJson(path.resolve(cwd, "package.json"))).version, "0.0.0-dev");
  await mockServer.verify(verifyMock);
});

test.serial('Allow local releases with "noCi" option', async (t) => {
  const envNoCi = { ...env };
  delete envNoCi.CI;
  const packageName = "test-no-ci";
  const owner = "git";
  // Create a git repository, set the current working directory at the root of the repo
  t.log("Create git repository and package.json");
  const { cwd, repositoryUrl, authUrl } = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson(path.resolve(cwd, "package.json"), {
    name: packageName,
    version: "0.0.0-dev",
    repository: { url: repositoryUrl },
    publishConfig: { registry: npmRegistry.url },
    release: { success: false, fail: false },
  });

  /* Initial release */
  const version = "1.0.0";
  const verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    { headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }] },
    { body: { permissions: { push: true }, clone_url: repositoryUrl }, method: "GET" }
  );
  const createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: { tag_name: `v${version}`, name: `v${version}` },
      headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }],
    },
    { body: { html_url: `release-url/${version}` } }
  );

  t.log("Commit a feature");
  await gitCommits(["feat: Initial commit"], { cwd });
  t.log("$ semantic-release --no-ci");
  const { stdout, exitCode } = await execa(cli, ["--no-ci"], { env: envNoCi, cwd, extendEnv: false });
  t.regex(stdout, new RegExp(`Published GitHub release: release-url/${version}`));
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(exitCode, 0);

  // Verify package.json and has been updated
  t.is((await readJson(path.resolve(cwd, "package.json"))).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  const { version: releasedVersion, gitHead: releasedGitHead } = await npmView(packageName, npmTestEnv);

  const head = await gitHead({ cwd });
  t.is(releasedVersion, version);
  t.is(releasedGitHead, head);
  t.is(await gitTagHead(`v${version}`, { cwd }), head);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`, { cwd }), head);
  t.log(`+ released ${releasedVersion} with head ${releasedGitHead}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createReleaseMock);
});

test.serial("Pass options via CLI arguments", async (t) => {
  const packageName = "test-cli";
  // Create a git repository, set the current working directory at the root of the repo
  t.log("Create git repository and package.json");
  const { cwd, repositoryUrl, authUrl } = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson(path.resolve(cwd, "package.json"), {
    name: packageName,
    version: "0.0.0-dev",
    repository: { url: repositoryUrl },
    publishConfig: { registry: npmRegistry.url },
  });

  /* Initial release */
  const version = "1.0.0";
  t.log("Commit a feature");
  await gitCommits(["feat: Initial commit"], { cwd });
  t.log("$ semantic-release");
  const { stdout, exitCode } = await execa(
    cli,
    [
      "--verify-conditions",
      "@semantic-release/npm",
      "--publish",
      "@semantic-release/npm",
      `--success`,
      false,
      `--fail`,
      false,
      "--debug",
    ],
    { env, cwd, extendEnv: false }
  );
  t.regex(stdout, new RegExp(`Publishing version ${version} to npm registry`));
  t.is(exitCode, 0);

  // Verify package.json and has been updated
  t.is((await readJson(path.resolve(cwd, "package.json"))).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  const { version: releasedVersion, gitHead: releasedGitHead } = await npmView(packageName, npmTestEnv);
  const head = await gitHead({ cwd });
  t.is(releasedVersion, version);
  t.is(releasedGitHead, head);
  t.is(await gitTagHead(`v${version}`, { cwd }), head);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`, { cwd }), head);
  t.log(`+ released ${releasedVersion} with head ${releasedGitHead}`);
});

test.serial("Run via JS API", async (t) => {
  await td.replaceEsm("../lib/logger", null, { log: () => {}, error: () => {}, stdout: () => {} });
  await td.replaceEsm("env-ci", null, () => ({ isCi: true, branch: "master", isPr: false }));
  const semanticRelease = (await import("../index.js")).default;
  const packageName = "test-js-api";
  const owner = "git";
  // Create a git repository, set the current working directory at the root of the repo
  t.log("Create git repository and package.json");
  const { cwd, repositoryUrl, authUrl } = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson(path.resolve(cwd, "package.json"), {
    name: packageName,
    version: "0.0.0-dev",
    repository: { url: repositoryUrl },
    publishConfig: { registry: npmRegistry.url },
    release: {
      fail: false,
      success: false,
    },
  });

  /* Initial release */
  const version = "1.0.0";
  const verifyMock = await mockServer.mock(
    `/repos/${owner}/${packageName}`,
    { headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }] },
    { body: { permissions: { push: true }, clone_url: repositoryUrl }, method: "GET" }
  );
  const createReleaseMock = await mockServer.mock(
    `/repos/${owner}/${packageName}/releases`,
    {
      body: { tag_name: `v${version}`, name: `v${version}` },
      headers: [{ name: "Authorization", values: [`token ${env.GH_TOKEN}`] }],
    },
    { body: { html_url: `release-url/${version}` } }
  );

  t.log("Commit a feature");
  await gitCommits(["feat: Initial commit"], { cwd });
  t.log("$ Call semantic-release via API");
  await semanticRelease(undefined, {
    cwd,
    env,
    stdout: new WritableStreamBuffer(),
    stderr: new WritableStreamBuffer(),
  });

  // Verify package.json and has been updated
  t.is((await readJson(path.resolve(cwd, "package.json"))).version, version);

  // Retrieve the published package from the registry and check version and gitHead
  const { version: releasedVersion, gitHead: releasedGitHead } = await npmView(packageName, npmTestEnv);
  const head = await gitHead({ cwd });
  t.is(releasedVersion, version);
  t.is(releasedGitHead, head);
  t.is(await gitTagHead(`v${version}`, { cwd }), head);
  t.is(await gitRemoteTagHead(authUrl, `v${version}`, { cwd }), head);
  t.log(`+ released ${releasedVersion} with head ${releasedGitHead}`);

  await mockServer.verify(verifyMock);
  await mockServer.verify(createReleaseMock);
});

test.serial("Log unexpected errors from plugins and exit with 1", async (t) => {
  const packageName = "test-unexpected-error";
  // Create a git repository, set the current working directory at the root of the repo
  t.log("Create git repository and package.json");
  const { cwd, repositoryUrl } = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson(path.resolve(cwd, "package.json"), {
    name: packageName,
    version: "0.0.0-dev",
    repository: { url: repositoryUrl },
    release: { verifyConditions: pluginError, fail: false, success: false },
  });

  /* Initial release */
  t.log("Commit a feature");
  await gitCommits(["feat: Initial commit"], { cwd });
  t.log("$ semantic-release");
  const { stderr, exitCode } = await execa(cli, [], { env, cwd, reject: false, extendEnv: false });
  // Verify the type and message are logged
  t.regex(stderr, /Error: a/);
  // Verify the stacktrace is logged
  t.regex(stderr, new RegExp(process.platform === "win32" ? pluginError.replace(/\\/g, "\\\\") : pluginError));
  // Verify the Error properties are logged
  t.regex(stderr, /errorProperty: 'errorProperty'/);
  t.is(exitCode, 1);
});

test.serial("Log errors inheriting SemanticReleaseError and exit with 1", async (t) => {
  const packageName = "test-inherited-error";
  // Create a git repository, set the current working directory at the root of the repo
  t.log("Create git repository and package.json");
  const { cwd, repositoryUrl } = await gitbox.createRepo(packageName);
  // Create package.json in repository root
  await writeJson(path.resolve(cwd, "package.json"), {
    name: packageName,
    version: "0.0.0-dev",
    repository: { url: repositoryUrl },
    release: { verifyConditions: pluginInheritedError, fail: false, success: false },
  });

  /* Initial release */
  t.log("Commit a feature");
  await gitCommits(["feat: Initial commit"], { cwd });
  t.log("$ semantic-release");
  const { stderr, exitCode } = await execa(cli, [], { env, cwd, reject: false, extendEnv: false });
  // Verify the type and message are logged
  t.regex(stderr, /EINHERITED Inherited error/);
  t.is(exitCode, 1);
});

test.serial("Exit with 1 if missing permission to push to the remote repository", async (t) => {
  const packageName = "unauthorized";
  // Create a git repository, set the current working directory at the root of the repo
  t.log("Create git repository");
  const { cwd } = await gitbox.createRepo(packageName);
  await writeJson(path.resolve(cwd, "package.json"), { name: packageName, version: "0.0.0-dev" });

  /* Initial release */
  t.log("Commit a feature");
  await gitCommits(["feat: Initial commit"], { cwd });
  await gitPush("origin", "master", { cwd });
  t.log("$ semantic-release");
  const { stderr, exitCode } = await execa(
    cli,
    ["--repository-url", "http://user:wrong_pass@localhost:2080/git/unauthorized.git"],
    { env: { ...env, GH_TOKEN: "user:wrong_pass" }, cwd, reject: false, extendEnv: false }
  );
  // Verify the type and message are logged
  t.regex(stderr, /EGITNOPERMISSION/);
  t.is(exitCode, 1);
});

test.serial("Hide sensitive environment variable values from the logs", async (t) => {
  const packageName = "log-secret";
  // Create a git repository, set the current working directory at the root of the repo
  t.log("Create git repository");
  const { cwd, repositoryUrl } = await gitbox.createRepo(packageName);
  await writeJson(path.resolve(cwd, "package.json"), {
    name: packageName,
    version: "0.0.0-dev",
    repository: { url: repositoryUrl },
    release: { verifyConditions: [pluginLogEnv], fail: false, success: false },
  });

  t.log("$ semantic-release");
  const { stdout, stderr } = await execa(cli, [], {
    env: { ...env, MY_TOKEN: "secret token" },
    cwd,
    reject: false,
    extendEnv: false,
  });

  t.regex(stdout, new RegExp(`Console: Exposing token ${escapeRegExp(SECRET_REPLACEMENT)}`));
  t.regex(stdout, new RegExp(`Log: Exposing token ${escapeRegExp(SECRET_REPLACEMENT)}`));
  t.regex(stderr, new RegExp(`Error: Console token ${escapeRegExp(SECRET_REPLACEMENT)}`));
  t.regex(stderr, new RegExp(`Throw error: Exposing ${escapeRegExp(SECRET_REPLACEMENT)}`));
});

test.serial("Use the valid git credentials when multiple are provided", async (t) => {
  const { cwd, authUrl } = await gitbox.createRepo("test-auth");

  t.is(
    await getAuthUrl({
      cwd,
      env: {
        GITHUB_TOKEN: "dummy",
        GITLAB_TOKEN: "trash",
        BB_TOKEN_BASIC_AUTH: gitbox.gitCredential,
        GIT_ASKPASS: "echo",
        GIT_TERMINAL_PROMPT: 0,
        GIT_CONFIG_PARAMETERS: "'credential.helper='",
      },
      branch: { name: "master" },
      options: { repositoryUrl: "http://toto@localhost:2080/git/test-auth.git" },
    }),
    authUrl
  );
});

test.serial("Use the repository URL as is if none of the given git credentials are valid", async (t) => {
  const { cwd } = await gitbox.createRepo("test-invalid-auth");
  const dummyUrl = "http://toto@localhost:2080/git/test-invalid-auth.git";

  t.is(
    await getAuthUrl({
      cwd,
      env: {
        GITHUB_TOKEN: "dummy",
        GITLAB_TOKEN: "trash",
        GIT_ASKPASS: "echo",
        GIT_TERMINAL_PROMPT: 0,
        GIT_CONFIG_PARAMETERS: "'credential.helper='",
      },
      branch: { name: "master" },
      options: { repositoryUrl: dummyUrl },
    }),
    dummyUrl
  );
});

test.serial("ESM Plugin with named exports", async (t) => {
  const packageName = "plugin-exports";
  // Create a git repository, set the current working directory at the root of the repo
  t.log("Create git repository");
  const { cwd, repositoryUrl } = await gitbox.createRepo(packageName);
  await writeJson(path.resolve(cwd, "package.json"), {
    name: packageName,
    version: "0.0.0-dev",
    repository: { url: repositoryUrl },
    release: { plugins: [pluginEsmNamedExports] },
  });

  t.log("$ semantic-release");
  const { stdout, stderr } = await execa(cli, [], {
    env: { ...env, MY_TOKEN: "secret token" },
    cwd,
    reject: false,
    extendEnv: false,
  });

  t.regex(stdout, new RegExp(`verifyConditions called`));
});

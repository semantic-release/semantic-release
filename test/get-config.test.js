import path from "node:path";
import { format } from "node:util";
import test from "ava";
import fsExtra from "fs-extra";
import { omit } from "lodash-es";
import * as td from "testdouble";
import yaml from "js-yaml";
import { gitAddConfig, gitCommits, gitRepo, gitShallowClone, gitTagVersion } from "./helpers/git-utils.js";

const { outputJson, writeFile } = fsExtra;
const pluginsConfig = { foo: "bar", baz: "qux" };
let plugins;

const DEFAULT_PLUGINS = [
  "@semantic-release/commit-analyzer",
  "@semantic-release/release-notes-generator",
  "@semantic-release/npm",
  "@semantic-release/github",
];

test.beforeEach(async (t) => {
  plugins = (await td.replaceEsm("../lib/plugins/index.js")).default;
  t.context.getConfig = (await import("../lib/get-config.js")).default;
});

test.afterEach.always((t) => {
  td.reset();
});

test("Default values, reading repositoryUrl from package.json", async (t) => {
  const pkg = { repository: "https://host.null/owner/package.git" };
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo(true);
  await gitCommits(["First"], { cwd });
  await gitTagVersion("v1.0.0", undefined, { cwd });
  await gitTagVersion("v1.1.0", undefined, { cwd });
  // Add remote.origin.url config
  await gitAddConfig("remote.origin.url", "git@host.null:owner/repo.git", { cwd });
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), pkg);

  const { options: result } = await t.context.getConfig({ cwd });

  // Verify the default options are set
  t.deepEqual(result.branches, [
    "+([0-9])?(.{+([0-9]),x}).x",
    "master",
    "main",
    "next",
    "next-major",
    { name: "beta", prerelease: true },
    { name: "alpha", prerelease: true },
  ]);
  t.is(result.repositoryUrl, "https://host.null/owner/package.git");
  t.is(result.tagFormat, `v\${version}`);
});

test("Default values, reading repositoryUrl from repo if not set in package.json", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo(true);
  // Add remote.origin.url config
  await gitAddConfig("remote.origin.url", "https://host.null/owner/module.git", { cwd });

  const { options: result } = await t.context.getConfig({ cwd });

  // Verify the default options are set
  t.deepEqual(result.branches, [
    "+([0-9])?(.{+([0-9]),x}).x",
    "master",
    "main",
    "next",
    "next-major",
    { name: "beta", prerelease: true },
    { name: "alpha", prerelease: true },
  ]);
  t.is(result.repositoryUrl, "https://host.null/owner/module.git");
  t.is(result.tagFormat, `v\${version}`);
});

test("Default values, reading repositoryUrl (http url) from package.json if not set in repo", async (t) => {
  const pkg = { repository: "https://host.null/owner/module.git" };
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), pkg);

  const { options: result } = await t.context.getConfig({ cwd });

  // Verify the default options are set
  t.deepEqual(result.branches, [
    "+([0-9])?(.{+([0-9]),x}).x",
    "master",
    "main",
    "next",
    "next-major",
    { name: "beta", prerelease: true },
    { name: "alpha", prerelease: true },
  ]);
  t.is(result.repositoryUrl, "https://host.null/owner/module.git");
  t.is(result.tagFormat, `v\${version}`);
});

test('Convert "ci" option to "noCi"', async (t) => {
  const pkg = { repository: "https://host.null/owner/module.git", release: { ci: false } };
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), pkg);

  const { options: result } = await t.context.getConfig({ cwd });

  t.is(result.noCi, true);
});

test.serial("Read options from package.json", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const options = {
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_param" },
    generateNotes: "generateNotes",
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Verify the plugins module is called with the plugin options from package.json
  td.when(plugins({ cwd, options }, {})).thenResolve(pluginsConfig);
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), { release: options });

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from package.json
  t.deepEqual(result, { options, plugins: pluginsConfig });
});

test.serial("Read options from .releaserc.yml", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const options = {
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_param" },
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json in repository root
  await writeFile(path.resolve(cwd, ".releaserc.yml"), yaml.dump(options));
  // Verify the plugins module is called with the plugin options from package.json
  td.when(plugins({ cwd, options }, {})).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from package.json
  t.deepEqual(result, { options, plugins: pluginsConfig });
});

test.serial("Read options from .releaserc.json", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const options = {
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_param" },
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, ".releaserc.json"), options);
  // Verify the plugins module is called with the plugin options from package.json
  td.when(plugins({ cwd, options }, {})).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from package.json
  t.deepEqual(result, { options, plugins: pluginsConfig });
});

test.serial("Read options from .releaserc.js", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const options = {
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_param" },
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json in repository root
  await writeFile(path.resolve(cwd, ".releaserc.js"), `module.exports = ${JSON.stringify(options)}`);
  // Verify the plugins module is called with the plugin options from package.json
  td.when(plugins({ cwd, options }, {})).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from package.json
  t.deepEqual(result, { options, plugins: pluginsConfig });
});

test.serial("Read options from .releaserc.cjs", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const options = {
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_param" },
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create .releaserc.cjs in repository root
  await writeFile(path.resolve(cwd, ".releaserc.cjs"), `module.exports = ${JSON.stringify(options)}`);
  // Verify the plugins module is called with the plugin options from .releaserc.cjs
  td.when(plugins({ cwd, options }, {})).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from .releaserc.cjs
  t.deepEqual(result, { options, plugins: pluginsConfig });
});

test.serial("Read options from .releaserc.mjs", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const options = {
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_param" },
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create .releaserc.mjs in repository root
  await writeFile(path.resolve(cwd, ".releaserc.mjs"), `export default ${JSON.stringify(options)}`);
  // Verify the plugins module is called with the plugin options from .releaserc.mjs
  td.when(plugins({ cwd, options }, {})).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from .releaserc.mjs
  t.deepEqual(result, { options, plugins: pluginsConfig });
});

test.serial("Read options from release.config.js", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const options = {
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_param" },
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json in repository root
  await writeFile(path.resolve(cwd, "release.config.js"), `module.exports = ${JSON.stringify(options)}`);
  // Verify the plugins module is called with the plugin options from package.json
  td.when(plugins({ cwd, options }, {})).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from package.json
  t.deepEqual(result, { options, plugins: pluginsConfig });
});

test.serial("Read options from release.config.cjs", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const options = {
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_param" },
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Verify the plugins module is called with the plugin options from release.config.cjs
  td.when(plugins({ cwd, options }, {})).thenResolve(pluginsConfig);
  // Create release.config.cjs in repository root
  await writeFile(path.resolve(cwd, "release.config.cjs"), `module.exports = ${JSON.stringify(options)}`);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from release.config.cjs
  t.deepEqual(result, { options, plugins: pluginsConfig });
});

test.serial("Read options from release.config.mjs", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const options = {
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_param" },
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Verify the plugins module is called with the plugin options from release.config.mjs
  td.when(plugins({ cwd, options }, {})).thenResolve(pluginsConfig);
  // Create release.config.mjs in repository root
  await writeFile(path.resolve(cwd, "release.config.mjs"), `export default ${JSON.stringify(options)}`);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from release.config.mjs
  t.deepEqual(result, { options, plugins: pluginsConfig });
});

test.serial("Prioritise CLI/API parameters over file configuration and git repo", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  let { cwd, repositoryUrl } = await gitRepo();
  await gitCommits(["First"], { cwd });
  // Create a clone
  cwd = await gitShallowClone(repositoryUrl);
  const pkgOptions = {
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_pkg" },
    branches: ["branch_pkg"],
  };
  const options = {
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_cli" },
    branches: ["branch_cli"],
    repositoryUrl: "http://cli-url.com/owner/package",
    tagFormat: `cli\${version}`,
    plugins: false,
  };
  // Verify the plugins module is called with the plugin options from CLI/API
  td.when(plugins({ cwd, options }, {})).thenResolve(pluginsConfig);
  const pkg = { release: pkgOptions, repository: "git@host.null:owner/module.git" };
  // Create package.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), pkg);

  const result = await t.context.getConfig({ cwd }, options);

  // Verify the options contains the plugin config from CLI/API
  t.deepEqual(result, { options, plugins: pluginsConfig });
});

test.serial('Read configuration from file path in "extends"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const pkgOptions = { extends: "./shareable.json" };
  const options = {
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_param" },
    generateNotes: "generateNotes",
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
    tagFormat: `v\${version}`,
    plugins: ["plugin-1", ["plugin-2", { plugin2Opt: "value" }]],
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), { release: pkgOptions });
  await outputJson(path.resolve(cwd, "shareable.json"), options);
  // Verify the plugins module is called with the plugin options from shareable.json
  td.when(
    plugins(
      { cwd, options },
      {
        analyzeCommits: "./shareable.json",
        generateNotes: "./shareable.json",
        "plugin-1": "./shareable.json",
        "plugin-2": "./shareable.json",
      }
    )
  ).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from shareable.json
  t.deepEqual(result, { options, plugins: pluginsConfig });
});

test.serial('Read configuration from module path in "extends"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const pkgOptions = { extends: "shareable" };
  const options = {
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_param" },
    generateNotes: "generateNotes",
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), { release: pkgOptions });
  await outputJson(path.resolve(cwd, "node_modules/shareable/index.json"), options);
  // Verify the plugins module is called with the plugin options from shareable.json
  td.when(plugins({ cwd, options }, { analyzeCommits: "shareable", generateNotes: "shareable" })).thenResolve(
    pluginsConfig
  );

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from shareable.json
  t.deepEqual(result, { options, plugins: pluginsConfig });
});

test.serial('Read configuration from an array of paths in "extends"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const pkgOptions = { extends: ["./shareable1.json", "./shareable2.json"] };
  const options1 = {
    verifyRelease: "verifyRelease1",
    analyzeCommits: { path: "analyzeCommits1", param: "analyzeCommits_param1" },
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
  };
  const options2 = {
    verifyRelease: "verifyRelease2",
    generateNotes: "generateNotes2",
    analyzeCommits: { path: "analyzeCommits2", param: "analyzeCommits_param2" },
    branches: ["test_branch"],
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), { release: pkgOptions });
  await outputJson(path.resolve(cwd, "shareable1.json"), options1);
  await outputJson(path.resolve(cwd, "shareable2.json"), options2);
  const expectedOptions = { ...options1, ...options2, branches: ["test_branch"] };
  // Verify the plugins module is called with the plugin options from shareable1.json and shareable2.json
  td.when(
    plugins(
      { options: expectedOptions, cwd },
      {
        verifyRelease1: "./shareable1.json",
        verifyRelease2: "./shareable2.json",
        generateNotes2: "./shareable2.json",
        analyzeCommits1: "./shareable1.json",
        analyzeCommits2: "./shareable2.json",
      }
    )
  ).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from shareable1.json and shareable2.json
  t.deepEqual(result, { options: expectedOptions, plugins: pluginsConfig });
});

test.serial('Read configuration from an array of CJS files in "extends"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const pkgOptions = { extends: ["./shareable1.cjs", "./shareable2.cjs"] };
  const options1 = {
    verifyRelease: "verifyRelease1",
    analyzeCommits: { path: "analyzeCommits1", param: "analyzeCommits_param1" },
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
  };
  const options2 = {
    verifyRelease: "verifyRelease2",
    generateNotes: "generateNotes2",
    analyzeCommits: { path: "analyzeCommits2", param: "analyzeCommits_param2" },
    branches: ["test_branch"],
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), { release: pkgOptions });
  await writeFile(path.resolve(cwd, "shareable1.cjs"), `module.exports = ${JSON.stringify(options1)}`);
  await writeFile(path.resolve(cwd, "shareable2.cjs"), `module.exports = ${JSON.stringify(options2)}`);
  const expectedOptions = { ...options1, ...options2, branches: ["test_branch"] };
  // Verify the plugins module is called with the plugin options from shareable1.mjs and shareable2.mjs
  td.when(
    plugins(
      { options: expectedOptions, cwd },
      {
        verifyRelease1: "./shareable1.cjs",
        verifyRelease2: "./shareable2.cjs",
        generateNotes2: "./shareable2.cjs",
        analyzeCommits1: "./shareable1.cjs",
        analyzeCommits2: "./shareable2.cjs",
      }
    )
  ).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from shareable1.json and shareable2.json
  t.deepEqual(result, { options: expectedOptions, plugins: pluginsConfig });
});

test.serial('Read configuration from an array of ESM files in "extends"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const pkgOptions = { extends: ["./shareable1.mjs", "./shareable2.mjs"] };
  const options1 = {
    verifyRelease: "verifyRelease1",
    analyzeCommits: { path: "analyzeCommits1", param: "analyzeCommits_param1" },
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
  };
  const options2 = {
    verifyRelease: "verifyRelease2",
    generateNotes: "generateNotes2",
    analyzeCommits: { path: "analyzeCommits2", param: "analyzeCommits_param2" },
    branches: ["test_branch"],
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), { release: pkgOptions });
  await writeFile(path.resolve(cwd, "shareable1.mjs"), `export default ${JSON.stringify(options1)}`);
  await writeFile(path.resolve(cwd, "shareable2.mjs"), `export default ${JSON.stringify(options2)}`);
  const expectedOptions = { ...options1, ...options2, branches: ["test_branch"] };
  // Verify the plugins module is called with the plugin options from shareable1.mjs and shareable2.mjs
  td.when(
    plugins(
      { options: expectedOptions, cwd },
      {
        verifyRelease1: "./shareable1.mjs",
        verifyRelease2: "./shareable2.mjs",
        generateNotes2: "./shareable2.mjs",
        analyzeCommits1: "./shareable1.mjs",
        analyzeCommits2: "./shareable2.mjs",
      }
    )
  ).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from shareable1.json and shareable2.json
  t.deepEqual(result, { options: expectedOptions, plugins: pluginsConfig });
});

test.serial('Prioritize configuration from config file over "extends"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const pkgOptions = {
    extends: "./shareable.json",
    branches: ["test_pkg"],
    generateNotes: "generateNotes",
    publish: [{ path: "publishPkg", param: "publishPkg_param" }],
  };
  const options1 = {
    analyzeCommits: "analyzeCommits",
    generateNotes: "generateNotesShareable",
    publish: [{ path: "publishShareable", param: "publishShareable_param" }],
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), { release: pkgOptions });
  await outputJson(path.resolve(cwd, "shareable.json"), options1);
  const expectedOptions = omit({ ...options1, ...pkgOptions, branches: ["test_pkg"] }, "extends");
  // Verify the plugins module is called with the plugin options from package.json and shareable.json
  td.when(
    plugins(
      { cwd, options: expectedOptions },
      {
        analyzeCommits: "./shareable.json",
        generateNotesShareable: "./shareable.json",
        publishShareable: "./shareable.json",
      }
    )
  ).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from package.json and shareable.json
  t.deepEqual(result, { options: expectedOptions, plugins: pluginsConfig });
});

test.serial('Prioritize configuration from cli/API options over "extends"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const cliOptions = {
    extends: "./shareable2.json",
    branches: ["branch_opts"],
    publish: [{ path: "publishOpts", param: "publishOpts_param" }],
    repositoryUrl: "https://host.null/owner/module.git",
  };
  const pkgOptions = {
    extends: "./shareable1.json",
    branches: ["branch_pkg"],
    generateNotes: "generateNotes",
    publish: [{ path: "publishPkg", param: "publishPkg_param" }],
  };
  const options1 = {
    analyzeCommits: "analyzeCommits1",
    generateNotes: "generateNotesShareable1",
    publish: [{ path: "publishShareable", param: "publishShareable_param1" }],
    branches: ["test_branch1"],
    repositoryUrl: "https://host.null/owner/module.git",
  };
  const options2 = {
    analyzeCommits: "analyzeCommits2",
    publish: [{ path: "publishShareable", param: "publishShareable_param2" }],
    branches: ["test_branch2"],
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create package.json, shareable1.json and shareable2.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), { release: pkgOptions });
  await outputJson(path.resolve(cwd, "shareable1.json"), options1);
  await outputJson(path.resolve(cwd, "shareable2.json"), options2);
  const expectedOptions = omit({ ...options2, ...pkgOptions, ...cliOptions, branches: ["branch_opts"] }, "extends");
  // Verify the plugins module is called with the plugin options from package.json and shareable2.json
  td.when(
    plugins(
      { cwd, options: expectedOptions },
      { analyzeCommits2: "./shareable2.json", publishShareable: "./shareable2.json" }
    )
  ).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd }, cliOptions);

  // Verify the options contains the plugin config from package.json and shareable2.json
  t.deepEqual(result, { options: expectedOptions, plugins: pluginsConfig });
});

test.serial('Allow to unset properties defined in shareable config with "null"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const pkgOptions = {
    extends: "./shareable.json",
    analyzeCommits: null,
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
    plugins: null,
  };
  const options1 = {
    generateNotes: "generateNotes",
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_param" },
    tagFormat: `v\${version}`,
    plugins: ["test-plugin"],
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), { release: pkgOptions });
  await outputJson(path.resolve(cwd, "shareable.json"), options1);
  // Verify the plugins module is called with the plugin options from shareable.json and the default `plugins`
  td.when(
    plugins(
      {
        options: {
          ...omit(options1, "analyzeCommits"),
          ...omit(pkgOptions, ["extends", "analyzeCommits"]),
          plugins: DEFAULT_PLUGINS,
        },
        cwd,
      },
      {
        generateNotes: "./shareable.json",
        analyzeCommits: "./shareable.json",
        "test-plugin": "./shareable.json",
      }
    )
  ).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from shareable.json and the default `plugins`
  t.deepEqual(result, {
    options: {
      ...omit(options1, ["analyzeCommits"]),
      ...omit(pkgOptions, ["extends", "analyzeCommits"]),
      plugins: DEFAULT_PLUGINS,
    },
    plugins: pluginsConfig,
  });
});

test.serial('Allow to unset properties defined in shareable config with "undefined"', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const pkgOptions = {
    extends: "./shareable.json",
    analyzeCommits: undefined,
    branches: ["test_branch"],
    repositoryUrl: "https://host.null/owner/module.git",
  };
  const options1 = {
    generateNotes: "generateNotes",
    analyzeCommits: { path: "analyzeCommits", param: "analyzeCommits_param" },
    tagFormat: `v\${version}`,
    plugins: false,
  };
  // Create release.config.js and shareable.json in repository root
  await writeFile(path.resolve(cwd, "release.config.js"), `module.exports = ${format(pkgOptions)}`);
  await outputJson(path.resolve(cwd, "shareable.json"), options1);
  const expectedOptions = {
    ...omit(options1, "analyzeCommits"),
    ...omit(pkgOptions, ["extends", "analyzeCommits"]),
    branches: ["test_branch"],
  };
  // Verify the plugins module is called with the plugin options from shareable.json
  td.when(
    plugins(
      { options: expectedOptions, cwd },
      { generateNotes: "./shareable.json", analyzeCommits: "./shareable.json" }
    )
  ).thenResolve(pluginsConfig);

  const result = await t.context.getConfig({ cwd });

  // Verify the options contains the plugin config from shareable.json
  t.deepEqual(result, { options: expectedOptions, plugins: pluginsConfig });
});

test("Throw an Error if one of the shareable config cannot be found", async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const pkgOptions = { extends: ["./shareable1.json", "non-existing-path"] };
  const options1 = { analyzeCommits: "analyzeCommits" };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), { release: pkgOptions });
  await outputJson(path.resolve(cwd, "shareable1.json"), options1);

  await t.throwsAsync(t.context.getConfig({ cwd }), {
    message: /Cannot find module 'non-existing-path'/,
    code: "MODULE_NOT_FOUND",
  });
});

test('Convert "ci" option to "noCi" when set from extended config', async (t) => {
  // Create a git repository, set the current working directory at the root of the repo
  const { cwd } = await gitRepo();
  const pkgOptions = { extends: "./no-ci.json" };
  const options = {
    ci: false,
  };
  // Create package.json and shareable.json in repository root
  await outputJson(path.resolve(cwd, "package.json"), { release: pkgOptions });
  await outputJson(path.resolve(cwd, "no-ci.json"), options);

  const { options: result } = await t.context.getConfig({ cwd });

  t.is(result.ci, false);
  t.is(result.noCi, true);
});

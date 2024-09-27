import test from "ava";
import { escapeRegExp } from "lodash-es";
import * as td from "testdouble";
import { stub } from "sinon";
import { SECRET_REPLACEMENT } from "../lib/definitions/constants.js";

let previousArgv;
let previousEnv;

test.beforeEach((t) => {
  t.context.logs = "";
  t.context.errors = "";
  t.context.stdout = stub(process.stdout, "write").callsFake((value) => {
    t.context.logs += value.toString();
  });
  t.context.stderr = stub(process.stderr, "write").callsFake((value) => {
    t.context.errors += value.toString();
  });

  previousArgv = process.argv;
  previousEnv = process.env;
});

test.afterEach.always((t) => {
  t.context.stdout.restore();
  t.context.stderr.restore();

  process.argv = previousArgv;
  process.env = previousEnv;

  td.reset();
});

test.serial("Pass options to semantic-release API", async (t) => {
  const argv = [
    "",
    "",
    "-b",
    "master",
    "next",
    "-r",
    "https://github/com/owner/repo.git",
    "-t",
    `v\${version}`,
    "-p",
    "plugin1",
    "plugin2",
    "-e",
    "config1",
    "config2",
    "--verify-conditions",
    "condition1",
    "condition2",
    "--analyze-commits",
    "analyze",
    "--verify-release",
    "verify1",
    "verify2",
    "--generate-notes",
    "notes",
    "--prepare",
    "prepare1",
    "prepare2",
    "--publish",
    "publish1",
    "publish2",
    "--success",
    "success1",
    "success2",
    "--fail",
    "fail1",
    "fail2",
    "--debug",
    "-d",
  ];
  const index = await td.replaceEsm("../index.js");
  process.argv = argv;
  const cli = (await import("../cli.js")).default;

  const exitCode = await cli();

  td.verify(
    index.default({
      branches: ["master", "next"],
      b: ["master", "next"],
      "repository-url": "https://github/com/owner/repo.git",
      repositoryUrl: "https://github/com/owner/repo.git",
      r: "https://github/com/owner/repo.git",
      "tag-format": `v\${version}`,
      tagFormat: `v\${version}`,
      t: `v\${version}`,
      plugins: ["plugin1", "plugin2"],
      p: ["plugin1", "plugin2"],
      extends: ["config1", "config2"],
      e: ["config1", "config2"],
      "dry-run": true,
      dryRun: true,
      d: true,
      verifyConditions: ["condition1", "condition2"],
      "verify-conditions": ["condition1", "condition2"],
      analyzeCommits: "analyze",
      "analyze-commits": "analyze",
      verifyRelease: ["verify1", "verify2"],
      "verify-release": ["verify1", "verify2"],
      generateNotes: ["notes"],
      "generate-notes": ["notes"],
      prepare: ["prepare1", "prepare2"],
      publish: ["publish1", "publish2"],
      success: ["success1", "success2"],
      fail: ["fail1", "fail2"],
      debug: true,
      _: [],
      $0: "",
    })
  );

  t.is(exitCode, 0);
});

test.serial("Pass options to semantic-release API with alias arguments", async (t) => {
  const argv = [
    "",
    "",
    "--branches",
    "master",
    "--repository-url",
    "https://github/com/owner/repo.git",
    "--tag-format",
    `v\${version}`,
    "--plugins",
    "plugin1",
    "plugin2",
    "--extends",
    "config1",
    "config2",
    "--dry-run",
  ];
  const index = await td.replaceEsm("../index.js");
  process.argv = argv;
  const cli = (await import("../cli.js")).default;

  const exitCode = await cli();

  td.verify(
    index.default({
      branches: ["master"],
      b: ["master"],
      "repository-url": "https://github/com/owner/repo.git",
      repositoryUrl: "https://github/com/owner/repo.git",
      r: "https://github/com/owner/repo.git",
      "tag-format": `v\${version}`,
      tagFormat: `v\${version}`,
      t: `v\${version}`,
      plugins: ["plugin1", "plugin2"],
      p: ["plugin1", "plugin2"],
      extends: ["config1", "config2"],
      e: ["config1", "config2"],
      "dry-run": true,
      dryRun: true,
      d: true,
      _: [],
      $0: "",
    })
  );

  t.is(exitCode, 0);
});

test.serial("Pass unknown options to semantic-release API", async (t) => {
  const argv = ["", "", "--bool", "--first-option", "value1", "--second-option", "value2", "--second-option", "value3"];
  const index = await td.replaceEsm("../index.js");
  process.argv = argv;
  const cli = (await import("../cli.js")).default;

  const exitCode = await cli();

  td.verify(
    index.default({
      bool: true,
      firstOption: "value1",
      "first-option": "value1",
      secondOption: ["value2", "value3"],
      "second-option": ["value2", "value3"],
      _: [],
      $0: "",
    })
  );

  t.is(exitCode, 0);
});

test.serial('Pass empty Array to semantic-release API for list option set to "false"', async (t) => {
  const argv = ["", "", "--publish", "false"];
  const index = await td.replaceEsm("../index.js");
  process.argv = argv;
  const cli = (await import("../cli.js")).default;

  const exitCode = await cli();

  td.verify(index.default({ publish: [], _: [], $0: "" }));

  t.is(exitCode, 0);
});

test.serial("Do not set properties in option for which arg is not in command line", async (t) => {
  const run = stub().resolves(true);
  const argv = ["", "", "-b", "master"];
  await td.replaceEsm("../index.js", null, run);
  process.argv = argv;
  const cli = (await import("../cli.js")).default;

  await cli();

  t.false("ci" in run.args[0][0]);
  t.false("d" in run.args[0][0]);
  t.false("dry-run" in run.args[0][0]);
  t.false("debug" in run.args[0][0]);
  t.false("r" in run.args[0][0]);
  t.false("t" in run.args[0][0]);
  t.false("p" in run.args[0][0]);
  t.false("e" in run.args[0][0]);
});

test.serial("Display help", async (t) => {
  const run = stub().resolves(true);
  const argv = ["", "", "--help"];
  await td.replaceEsm("../index.js", null, run);
  process.argv = argv;
  const cli = (await import("../cli.js")).default;

  const exitCode = await cli();

  t.regex(t.context.logs, /Run automated package publishing/);
  t.is(exitCode, 0);
});

test.serial("Return error exitCode and prints help if called with a command", async (t) => {
  const run = stub().resolves(true);
  const argv = ["", "", "pre"];
  await td.replaceEsm("../index.js", null, run);
  process.argv = argv;
  const cli = (await import("../cli.js")).default;

  const exitCode = await cli();

  t.regex(t.context.errors, /Run automated package publishing/);
  t.regex(t.context.errors, /Too many non-option arguments/);
  t.is(exitCode, 1);
});

test.serial("Return error exitCode if multiple plugin are set for single plugin", async (t) => {
  const run = stub().resolves(true);
  const argv = ["", "", "--analyze-commits", "analyze1", "analyze2"];
  await td.replaceEsm("../index.js", null, run);
  process.argv = argv;
  const cli = (await import("../cli.js")).default;

  const exitCode = await cli();

  t.regex(t.context.errors, /Run automated package publishing/);
  t.regex(t.context.errors, /Too many non-option arguments/);
  t.is(exitCode, 1);
});

test.serial("Return error exitCode if semantic-release throw error", async (t) => {
  const argv = ["", ""];
  const index = await td.replaceEsm("../index.js");
  td.when(index.default({ _: [], $0: "" })).thenReject(new Error("semantic-release error"));
  process.argv = argv;
  const cli = (await import("../cli.js")).default;

  const exitCode = await cli();

  t.regex(t.context.errors, /semantic-release error/);
  t.is(exitCode, 1);
});

test.serial("Hide sensitive environment variable values from the logs", async (t) => {
  const env = { MY_TOKEN: "secret token" };
  const argv = ["", ""];
  const index = await td.replaceEsm("../index.js");
  td.when(index.default({ _: [], $0: "" })).thenReject(new Error(`Throw error: Exposing token ${env.MY_TOKEN}`));
  process.argv = argv;
  process.env = { ...process.env, ...env };
  const cli = (await import("../cli.js")).default;

  const exitCode = await cli();

  t.regex(t.context.errors, new RegExp(`Throw error: Exposing token ${escapeRegExp(SECRET_REPLACEMENT)}`));
  t.is(exitCode, 1);
});

import test from "ava";
import { temporaryDirectory } from "tempy";
import verify from "../lib/verify.js";
import { gitRepo } from "./helpers/git-utils.js";

test("Throw a AggregateError", async (t) => {
  const { cwd } = await gitRepo();
  const options = { branches: [{ name: "master" }, { name: "" }] };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.is(errors[0].name, "SemanticReleaseError");
  t.is(errors[0].code, "ENOREPOURL");
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
  t.is(errors[1].name, "SemanticReleaseError");
  t.is(errors[1].code, "EINVALIDTAGFORMAT");
  t.truthy(errors[1].message);
  t.truthy(errors[1].details);
  t.is(errors[2].name, "SemanticReleaseError");
  t.is(errors[2].code, "ETAGNOVERSION");
  t.truthy(errors[2].message);
  t.truthy(errors[2].details);
  t.is(errors[3].name, "SemanticReleaseError");
  t.is(errors[3].code, "EINVALIDBRANCH");
  t.truthy(errors[3].message);
  t.truthy(errors[3].details);
});

test("Throw a SemanticReleaseError if does not run on a git repository", async (t) => {
  const cwd = temporaryDirectory();
  const options = { branches: [] };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.is(errors[0].name, "SemanticReleaseError");
  t.is(errors[0].code, "ENOGITREPO");
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
});

test('Throw a SemanticReleaseError if the "tagFormat" is not valid', async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = { repositoryUrl, tagFormat: `?\${version}`, branches: [] };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.is(errors[0].name, "SemanticReleaseError");
  t.is(errors[0].code, "EINVALIDTAGFORMAT");
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
});

test('Throw a SemanticReleaseError if the "tagFormat" does not contains the "version" variable', async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = { repositoryUrl, tagFormat: "test", branches: [] };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.is(errors[0].name, "SemanticReleaseError");
  t.is(errors[0].code, "ETAGNOVERSION");
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
});

test('Throw a SemanticReleaseError if the "tagFormat" contains multiple "version" variables', async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = { repositoryUrl, tagFormat: `\${version}v\${version}`, branches: [] };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.is(errors[0].name, "SemanticReleaseError");
  t.is(errors[0].code, "ETAGNOVERSION");
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
});

test('Throw a SemanticReleaseError if the "tagFormat" contains template evaluation syntax', async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = {
    repositoryUrl,
    tagFormat: `v\${version}<% process.env.EXFILTRATED = "yes" %>`,
    branches: [],
  };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.is(errors[0].name, "SemanticReleaseError");
  t.is(errors[0].code, "EINVALIDTAGFORMAT");
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
});

test("Throw a SemanticReleaseError for each invalid branch", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = {
    repositoryUrl,
    tagFormat: `v\${version}`,
    branches: [{ name: "" }, { name: "  " }, { name: 1 }, {}, { name: "" }, 1, "master"],
  };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.is(errors[0].name, "SemanticReleaseError");
  t.is(errors[0].code, "EINVALIDBRANCH");
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
  t.is(errors[1].name, "SemanticReleaseError");
  t.is(errors[1].code, "EINVALIDBRANCH");
  t.truthy(errors[1].message);
  t.truthy(errors[1].details);
  t.is(errors[2].name, "SemanticReleaseError");
  t.is(errors[2].code, "EINVALIDBRANCH");
  t.truthy(errors[2].message);
  t.truthy(errors[2].details);
  t.is(errors[3].name, "SemanticReleaseError");
  t.is(errors[3].code, "EINVALIDBRANCH");
  t.truthy(errors[3].message);
  t.truthy(errors[3].details);
  t.is(errors[4].code, "EINVALIDBRANCH");
  t.truthy(errors[4].message);
  t.truthy(errors[4].details);
  t.is(errors[5].code, "EINVALIDBRANCH");
  t.truthy(errors[5].message);
  t.truthy(errors[5].details);
});

test('Throw a SemanticReleaseError if the "repositoryUrl" starts with "-"', async (t) => {
  const { cwd } = await gitRepo(true);
  const options = { repositoryUrl: "--upload-pack=/bin/sh", tagFormat: `v\${version}`, branches: [{ name: "master" }] };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.is(errors[0].name, "SemanticReleaseError");
  t.is(errors[0].code, "EINVALIDREPOURL");
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
});

test('Return "true" if all verification pass', async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = { repositoryUrl, tagFormat: `v\${version}`, branches: [{ name: "master" }] };

  await t.notThrowsAsync(verify({ cwd, options }));
});

test("Throw a SemanticReleaseError if the monorepo option resolves to no path", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = { repositoryUrl, tagFormat: `v\${version}`, branches: [], monorepo: { paths: [] } };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.is(errors[0].name, "SemanticReleaseError");
  t.is(errors[0].code, "EINVALIDMONOREPOPATH");
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
});

test("Accept a monorepo option resolving to at least one path", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = {
    repositoryUrl,
    branches: [{ name: "master" }],
    tagFormat: `v\${version}`,
    monorepo: { paths: ["packages/foo"] },
  };

  await t.notThrowsAsync(verify({ cwd, options }));
});

test("Do not report a monorepo problem outside of a git repository", async (t) => {
  const cwd = temporaryDirectory();
  const options = { tagFormat: `v\${version}`, branches: [], monorepo: { paths: [] } };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.deepEqual(
    errors.map(({ code }) => code),
    ["ENOGITREPO"]
  );
});

test("Throw a SemanticReleaseError if a monorepo path contains a parent directory segment", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = {
    repositoryUrl,
    tagFormat: `v\${version}`,
    branches: [],
    // `..` can never appear in a path reported by git, so this could only ever match nothing
    monorepo: { paths: ["packages/foo", "packages/bar/../shared"] },
  };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.is(errors[0].code, "EINVALIDMONOREPOPATH");
  t.truthy(errors[0].message);
  t.true(errors[0].details.includes("packages/bar/../shared"));
});

test("Accept a monorepo path whose segments merely start with dots", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = {
    repositoryUrl,
    tagFormat: `v\${version}`,
    branches: [{ name: "master" }],
    // `..foo` is a valid directory name and a path that can match, unlike the `..` segment
    monorepo: { paths: ["packages/..foo", "packages/.hidden"] },
  };

  await t.notThrowsAsync(verify({ cwd, options }));
});

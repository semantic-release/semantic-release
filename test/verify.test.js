import test from "ava";
import { temporaryDirectory } from "tempy";
import verify from "../lib/verify.js";
import { gitRepo } from "./helpers/git-utils.js";
import {
  ADD_CHANNLE_LIFECYCLE,
  ANALYZE_COMMITS_LIFECYCLE,
  FAIL_LIFECYCLE,
  PREPARE_LIFECYCLE,
  PUBLISH_LIFECYCLE,
  SUCCESS_LIFECYCLE,
  VERIFY_CONDITIONS_LIFECYCLE,
  VERIFY_RELEASE_LIFECYCLE,
  GENERATE_NOTES_LIFECYCLE,
} from "../lib/definitions/constants.js";

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
  const options = { repositoryUrl, tagFormat: `?\${version}`, tagReleaseAfter: PREPARE_LIFECYCLE, branches: [] };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.is(errors[0].name, "SemanticReleaseError");
  t.is(errors[0].code, "EINVALIDTAGFORMAT");
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
});

test('Throw a SemanticReleaseError if the "tagFormat" does not contains the "version" variable', async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = { repositoryUrl, tagFormat: "test", tagReleaseAfter: PUBLISH_LIFECYCLE, branches: [] };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.is(errors[0].name, "SemanticReleaseError");
  t.is(errors[0].code, "ETAGNOVERSION");
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
});

test('Throw a SemanticReleaseError if the "tagFormat" contains multiple "version" variables', async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = {
    repositoryUrl,
    tagFormat: `\${version}v\${version}`,
    tagReleaseAfter: PUBLISH_LIFECYCLE,
    branches: [],
  };

  const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

  t.is(errors[0].name, "SemanticReleaseError");
  t.is(errors[0].code, "ETAGNOVERSION");
  t.truthy(errors[0].message);
  t.truthy(errors[0].details);
});

test('Throw a SemanticReleaseError if the "tagReleaseAfter" does not contain allowed lifecycle', async (t) => {
  const notAllowedLifecycles = [
    FAIL_LIFECYCLE,
    SUCCESS_LIFECYCLE,
    VERIFY_CONDITIONS_LIFECYCLE,
    VERIFY_RELEASE_LIFECYCLE,
    ADD_CHANNLE_LIFECYCLE,
    ANALYZE_COMMITS_LIFECYCLE,
    GENERATE_NOTES_LIFECYCLE,
    "somethingWrong",
  ];
  const { cwd, repositoryUrl } = await gitRepo(true);

  await Promise.allSettled(
    notAllowedLifecycles.map(async (lifecycle) => {
      const options = { repositoryUrl, tagFormat: `v\${version}`, branches: [], tagReleaseAfter: lifecycle };
      const errors = [...(await t.throwsAsync(verify({ cwd, options }))).errors];

      t.is(errors[0].name, "SemanticReleaseError");
      t.is(errors[0].code, "EINVALIDTAGRELEASEAFTER");
      t.truthy(errors[0].message);
      t.truthy(errors[0].details);
    })
  );
});

test("Throw a SemanticReleaseError for each invalid branch", async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = {
    repositoryUrl,
    tagFormat: `v\${version}`,
    tagReleaseAfter: PREPARE_LIFECYCLE,
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

test('Return "true" if all verification pass', async (t) => {
  const { cwd, repositoryUrl } = await gitRepo(true);
  const options = {
    repositoryUrl,
    tagFormat: `v\${version}`,
    tagReleaseAfter: PREPARE_LIFECYCLE,
    branches: [{ name: "master" }],
  };

  await t.notThrowsAsync(verify({ cwd, options }));
});

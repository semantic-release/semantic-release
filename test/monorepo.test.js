import test from "ava";
import {
  decideOnFailedPush,
  isMonorepoConfigValid,
  matchesPaths,
  normalizePath,
  PROCEED,
  resolveMonorepoPaths,
  SKIP,
  UNAUTHORIZED,
} from "../lib/monorepo.js";

test("normalizePath cleans a configured path", (t) => {
  t.is(normalizePath("packages/foo"), "packages/foo");
  t.is(normalizePath("./packages/foo"), "packages/foo");
  t.is(normalizePath("packages/foo/"), "packages/foo");
  t.is(normalizePath("/packages/foo/"), "packages/foo");
  t.is(normalizePath("  packages/foo  "), "packages/foo");
  t.is(normalizePath("packages/nested/deep/"), "packages/nested/deep");
  t.is(normalizePath("packages/foo/."), "packages/foo");
});

test("normalizePath returns an empty string when nothing is designated", (t) => {
  t.is(normalizePath(""), "");
  t.is(normalizePath("."), "");
  t.is(normalizePath("./"), "");
  t.is(normalizePath("/"), "");
});

test("isMonorepoConfigValid accepts true, a string path and an array of strings", (t) => {
  t.true(isMonorepoConfigValid(true));
  t.true(isMonorepoConfigValid({}));
  t.true(isMonorepoConfigValid({ path: "packages/foo" }));
  t.true(isMonorepoConfigValid({ path: ["packages/foo", "packages/bar"] }));
});

test("isMonorepoConfigValid rejects anything else", (t) => {
  t.false(isMonorepoConfigValid(false));
  t.false(isMonorepoConfigValid("packages/foo"));
  t.false(isMonorepoConfigValid({ path: 42 }));
  t.false(isMonorepoConfigValid({ path: ["packages/foo", 42] }));
});

test("resolveMonorepoPaths infers the path from the working directory", (t) => {
  t.deepEqual(resolveMonorepoPaths(true, "packages/foo/"), ["packages/foo"]);
  t.deepEqual(resolveMonorepoPaths({}, "packages/foo/"), ["packages/foo"]);
});

test("resolveMonorepoPaths prefers the configured path", (t) => {
  t.deepEqual(resolveMonorepoPaths({ path: "packages/bar" }, "packages/foo/"), ["packages/bar"]);
  t.deepEqual(resolveMonorepoPaths({ path: ["./packages/bar/", "packages/shared"] }, "packages/foo/"), [
    "packages/bar",
    "packages/shared",
  ]);
});

test("resolveMonorepoPaths returns nothing for an unusable configuration", (t) => {
  // `monorepo: true` from the repository root resolves to no path
  t.deepEqual(resolveMonorepoPaths(true, ""), []);
  t.deepEqual(resolveMonorepoPaths({ path: "" }, "packages/foo/"), []);
  t.deepEqual(resolveMonorepoPaths({ path: "./" }, "packages/foo/"), []);
  t.deepEqual(resolveMonorepoPaths({ path: "." }, "packages/foo/"), []);
  t.deepEqual(resolveMonorepoPaths("packages/foo", "packages/foo/"), []);
  t.deepEqual(resolveMonorepoPaths(42, ""), []);
});

test("matchesPaths matches the path itself and its content, on a path boundary", (t) => {
  t.true(matchesPaths(["packages/a/src/index.js"], ["packages/a"]));
  t.true(matchesPaths(["packages/a"], ["packages/a"]));
  t.true(matchesPaths(["packages/a/deep/file.js"], ["packages/a"]));
  t.true(matchesPaths(["packages/b/index.js", "packages/a/index.js"], ["packages/a"]));
  t.true(matchesPaths(["packages/a/index.js"], ["packages/b", "packages/a"]));
});

test("matchesPaths does not match a sibling with a shared prefix", (t) => {
  t.false(matchesPaths(["packages/ab/index.js"], ["packages/a"]));
  t.false(matchesPaths(["packages/b/index.js"], ["packages/a"]));
  t.false(matchesPaths([], ["packages/a"]));
});

test("decideOnFailedPush proceeds when the branch is up to date and a path is configured", (t) => {
  t.deepEqual(decideOnFailedPush({ upToDate: true, changedFiles: undefined, paths: ["packages/a"] }), {
    decision: PROCEED,
    reason: "up-to-date",
  });
});

test("decideOnFailedPush reports a permission problem without a configured path", (t) => {
  t.deepEqual(decideOnFailedPush({ upToDate: true, changedFiles: undefined, paths: [] }), {
    decision: UNAUTHORIZED,
    reason: "up-to-date",
  });
  t.deepEqual(decideOnFailedPush({ upToDate: false, changedFiles: ["packages/a/x.js"], paths: [] }), {
    decision: SKIP,
    reason: "not-up-to-date",
  });
});

test("decideOnFailedPush skips when the missing changes affect the path", (t) => {
  t.deepEqual(decideOnFailedPush({ upToDate: false, changedFiles: ["packages/a/x.js"], paths: ["packages/a"] }), {
    decision: SKIP,
    reason: "path-affected",
  });
});

test("decideOnFailedPush proceeds when the missing changes are outside the path", (t) => {
  t.deepEqual(decideOnFailedPush({ upToDate: false, changedFiles: ["packages/b/x.js"], paths: ["packages/a"] }), {
    decision: PROCEED,
    reason: "path-unaffected",
  });
});

test("decideOnFailedPush skips when the missing changes could not be determined", (t) => {
  t.deepEqual(decideOnFailedPush({ upToDate: false, changedFiles: undefined, paths: ["packages/a"] }), {
    decision: SKIP,
    reason: "undetermined",
  });
});

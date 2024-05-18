import test from "ava";
import getTags from "../../lib/branches/get-tags.js";
import { gitAddNote, gitCheckout, gitCommitAndTag, gitCommits, gitRepo, gitTagVersion } from "../helpers/git-utils.js";

test("Get the valid tags", async (t) => {
  const { cwd } = await gitRepo();
  await gitCommitAndTag("Valid", "v0.0.4", { cwd });
  await gitCommitAndTag("Valid", "v1.2.3", { cwd });
  await gitCommitAndTag("Valid", "v10.20.30", { cwd });
  await gitCommitAndTag("Valid", "v1.1.2-prerelease+meta", { cwd });
  await gitCommitAndTag("Valid", "v1.1.2+meta", { cwd });
  await gitCommitAndTag("Valid", "v1.1.2+meta-valid", { cwd });
  await gitCommitAndTag("Valid", "v1.0.0-alpha+beta", { cwd });
  await gitCommitAndTag("Valid", "v1.0.0-alpha", { cwd });
  await gitCommitAndTag("Valid", "v1.0.0-beta", { cwd });
  await gitCommitAndTag("Valid", "v1.0.0-alpha.beta", { cwd });
  await gitCommitAndTag("Valid", "v1.0.0-alpha.beta.1", { cwd });
  await gitCommitAndTag("Valid", "v1.0.0-alpha.1", { cwd });
  await gitCommitAndTag("Valid", "v1.0.0-alpha0.valid", { cwd });
  await gitCommitAndTag("Valid", "v1.0.0-alpha.0valid", { cwd });
  await gitCommitAndTag("Valid", "v1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay", { cwd });
  await gitCommitAndTag("Valid", "v1.0.0-rc.1+build.1", { cwd });
  await gitCommitAndTag("Valid", "v2.0.0-rc.1+build.123", { cwd });
  await gitCommitAndTag("Valid", "v1.2.3-beta", { cwd });
  await gitCommitAndTag("Valid", "v10.2.3-DEV-SNAPSHOT", { cwd });
  await gitCommitAndTag("Valid", "v1.2.3-SNAPSHOT-123", { cwd });
  await gitCommitAndTag("Valid", "v1.0.0", { cwd });
  await gitCommitAndTag("Valid", "v2.0.0", { cwd });
  await gitCommitAndTag("Valid", "v1.1.7", { cwd });
  await gitCommitAndTag("Valid", "v2.0.0+build.1848", { cwd });
  await gitCommitAndTag("Valid", "v2.0.1-alpha.1227", { cwd });
  await gitCommitAndTag("Valid", "v1.2.3----RC-SNAPSHOT.12.9.1--.12+788", { cwd });
  await gitCommitAndTag("Valid", "v1.2.3----R-S.12.9.1--.12+meta", { cwd });
  await gitCommitAndTag("Valid", "v1.2.3----RC-SNAPSHOT.12.9.1--.12", { cwd });
  await gitCommitAndTag("Valid", "v1.0.0+0.build.1-rc.10000aaa-kk-0.1", { cwd });
  await gitCommitAndTag("Valid", "v99999.99999.999999", { cwd });
  await gitCommitAndTag("Valid", "v1.0.0-0A.is.legal", { cwd });

  await gitCommitAndTag("Invalid", "v1", { cwd });
  await gitCommitAndTag("Invalid", "v1.2", { cwd });
  await gitCommitAndTag("Invalid", "v1.2.3-0123", { cwd });
  await gitCommitAndTag("Invalid", "v1.2.3-0123.0123", { cwd });
  await gitCommitAndTag("Invalid", "v1.1.2+.123", { cwd });
  await gitCommitAndTag("Invalid", "v+invalid", { cwd });
  await gitCommitAndTag("Invalid", "v-invalid", { cwd });
  await gitCommitAndTag("Invalid", "v-invalid+invalid", { cwd });
  await gitCommitAndTag("Invalid", "v-invalid.01", { cwd });
  await gitCommitAndTag("Invalid", "valpha", { cwd });
  await gitCommitAndTag("Invalid", "valpha.beta", { cwd });
  await gitCommitAndTag("Invalid", "valpha.beta.1", { cwd });
  await gitCommitAndTag("Invalid", "valpha.1", { cwd });
  await gitCommitAndTag("Invalid", "valpha+beta", { cwd });
  await gitCommitAndTag("Invalid", "valpha_beta", { cwd });
  await gitCommitAndTag("Invalid", "vbeta", { cwd });
  await gitCommitAndTag("Invalid", "v1.0.0-alpha_beta", { cwd });
  await gitCommitAndTag("Invalid", "v01.1.1", { cwd });
  await gitCommitAndTag("Invalid", "v1.01.1", { cwd });
  await gitCommitAndTag("Invalid", "v1.1.01", { cwd });
  await gitCommitAndTag("Invalid", "v1.2.3.DEV", { cwd });
  await gitCommitAndTag("Invalid", "v1.2-SNAPSHOT", { cwd });
  await gitCommitAndTag("Invalid", "v1.2-RC-SNAPSHOT", { cwd });
  await gitCommitAndTag("Invalid", "v-1.0.3-gamma+b7718", { cwd });
  await gitCommitAndTag("Invalid", "v+justmeta", { cwd });
  await gitCommitAndTag("Invalid", "v9.8.7+meta+meta", { cwd });
  await gitCommitAndTag("Invalid", "v9.8.7-whatever+meta+meta", { cwd });

  const result = await getTags({ cwd, options: { tagFormat: `v\${version}` } }, [{ name: "master" }]);

  t.deepEqual(result, [
    {
      name: "master",
      tags: [
        { gitTag: "v0.0.4", version: "0.0.4", channels: [null] },
        { gitTag: "v1.0.0-0A.is.legal", version: "1.0.0-0A.is.legal", channels: [null] },
        { gitTag: "v1.0.0-alpha", version: "1.0.0-alpha", channels: [null] },
        { gitTag: "v1.0.0-alpha+beta", version: "1.0.0-alpha", channels: [null] },
        { gitTag: "v1.0.0-alpha.1", version: "1.0.0-alpha.1", channels: [null] },
        { gitTag: "v1.0.0-alpha.0valid", version: "1.0.0-alpha.0valid", channels: [null] },
        { gitTag: "v1.0.0-alpha.beta", version: "1.0.0-alpha.beta", channels: [null] },
        { gitTag: "v1.0.0-alpha.beta.1", version: "1.0.0-alpha.beta.1", channels: [null] },
        { gitTag: "v1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay", version: "1.0.0-alpha-a.b-c-somethinglong", channels: [null] },
        { gitTag: "v1.0.0-alpha0.valid", version: "1.0.0-alpha0.valid", channels: [null] },
        { gitTag: "v1.0.0-beta", version: "1.0.0-beta", channels: [null] },
        { gitTag: "v1.0.0-rc.1+build.1", version: "1.0.0-rc.1", channels: [null] },
        { gitTag: "v1.0.0", version: "1.0.0", channels: [null] },
        { gitTag: "v1.0.0+0.build.1-rc.10000aaa-kk-0.1", version: "1.0.0", channels: [null] },
        { gitTag: "v1.1.2-prerelease+meta", version: "1.1.2-prerelease", channels: [null] },
        { gitTag: "v1.1.2+meta", version: "1.1.2", channels: [null] },
        { gitTag: "v1.1.2+meta-valid", version: "1.1.2", channels: [null] },
        { gitTag: "v1.1.7", version: "1.1.7", channels: [null] },
        { gitTag: "v1.2.3----R-S.12.9.1--.12+meta", version: "1.2.3----R-S.12.9.1--.12", channels: [null] },
        { gitTag: "v1.2.3----RC-SNAPSHOT.12.9.1--.12", version: "1.2.3----RC-SNAPSHOT.12.9.1--.12", channels: [null] },
        { gitTag: "v1.2.3----RC-SNAPSHOT.12.9.1--.12+788", version: "1.2.3----RC-SNAPSHOT.12.9.1--.12", channels: [null] },
        { gitTag: "v1.2.3-SNAPSHOT-123", version: "1.2.3-SNAPSHOT-123", channels: [null] },
        { gitTag: "v1.2.3-beta", version: "1.2.3-beta", channels: [null] },
        { gitTag: "v1.2.3", version: "1.2.3", channels: [null] },
        { gitTag: "v2.0.0-rc.1+build.123", version: "2.0.0-rc.1", channels: [null] },
        { gitTag: "v2.0.0", version: "2.0.0", channels: [null] },
        { gitTag: "v2.0.0+build.1848", version: "2.0.0", channels: [null] },
        { gitTag: "v2.0.1-alpha.1227", version: "2.0.1-alpha.1227", channels: [null] },
        { gitTag: "v10.2.3-DEV-SNAPSHOT", version: "10.2.3-DEV-SNAPSHOT", channels: [null] },
        { gitTag: "v10.20.30", version: "10.20.30", channels: [null] },
        { gitTag: "v99999.99999.999999", version: "99999.99999.999999", channels: [null] }
      ],
    },
  ]);
});

test("Get the valid tags from multiple branches", async (t) => {
  const { cwd } = await gitRepo();
  await gitCommits(["First"], { cwd });
  await gitTagVersion("v1.0.0", undefined, { cwd });
  await gitAddNote(JSON.stringify({ channels: [null, "1.x"] }), "v1.0.0", { cwd });
  await gitCommits(["Second"], { cwd });
  await gitTagVersion("v1.1.0", undefined, { cwd });
  await gitAddNote(JSON.stringify({ channels: [null, "1.x"] }), "v1.1.0", { cwd });
  await gitCheckout("1.x", true, { cwd });
  await gitCheckout("master", false, { cwd });
  await gitCommits(["Third"], { cwd });
  await gitTagVersion("v2.0.0", undefined, { cwd });
  await gitAddNote(JSON.stringify({ channels: [null, "next"] }), "v2.0.0", { cwd });
  await gitCheckout("next", true, { cwd });
  await gitCommits(["Fourth"], { cwd });
  await gitTagVersion("v3.0.0", undefined, { cwd });
  await gitAddNote(JSON.stringify({ channels: ["next"] }), "v3.0.0", { cwd });

  const result = await getTags({ cwd, options: { tagFormat: `v\${version}` } }, [
    { name: "1.x" },
    { name: "master" },
    { name: "next" },
  ]);

  t.deepEqual(result, [
    {
      name: "1.x",
      tags: [
        { gitTag: "v1.0.0", version: "1.0.0", channels: [null, "1.x"] },
        { gitTag: "v1.1.0", version: "1.1.0", channels: [null, "1.x"] },
      ],
    },
    {
      name: "master",
      tags: [...result[0].tags, { gitTag: "v2.0.0", version: "2.0.0", channels: [null, "next"] }],
    },
    {
      name: "next",
      tags: [...result[1].tags, { gitTag: "v3.0.0", version: "3.0.0", channels: ["next"] }],
    },
  ]);
});

test("Return branches with and empty tags array if no valid tag is found", async (t) => {
  const { cwd } = await gitRepo();
  await gitCommits(["First"], { cwd });
  await gitTagVersion("foo", undefined, { cwd });
  await gitCommits(["Second"], { cwd });
  await gitTagVersion("v2.0.x", undefined, { cwd });
  await gitCommits(["Third"], { cwd });
  await gitTagVersion("v3.0", undefined, { cwd });

  const result = await getTags({ cwd, options: { tagFormat: `prefix@v\${version}` } }, [{ name: "master" }]);

  t.deepEqual(result, [{ name: "master", tags: [] }]);
});

test("Return branches with and empty tags array if no valid tag is found in history of configured branches", async (t) => {
  const { cwd } = await gitRepo();
  await gitCommits(["First"], { cwd });
  await gitCheckout("next", true, { cwd });
  await gitCommits(["Second"], { cwd });
  await gitTagVersion("v1.0.0", undefined, { cwd });
  await gitAddNote(JSON.stringify({ channels: [null, "next"] }), "v1.0.0", { cwd });
  await gitCommits(["Third"], { cwd });
  await gitTagVersion("v2.0.0", undefined, { cwd });
  await gitAddNote(JSON.stringify({ channels: [null, "next"] }), "v2.0.0", { cwd });
  await gitCommits(["Fourth"], { cwd });
  await gitTagVersion("v3.0.0", undefined, { cwd });
  await gitAddNote(JSON.stringify({ channels: [null, "next"] }), "v3.0.0", { cwd });
  await gitCheckout("master", false, { cwd });

  const result = await getTags({ cwd, options: { tagFormat: `prefix@v\${version}` } }, [
    { name: "master" },
    { name: "next" },
  ]);

  t.deepEqual(result, [
    { name: "master", tags: [] },
    { name: "next", tags: [] },
  ]);
});

test('Get the highest valid tag corresponding to the "tagFormat"', async (t) => {
  const { cwd } = await gitRepo();
  await gitCommits(["First"], { cwd });

  await gitTagVersion("1.0.0", undefined, { cwd });
  t.deepEqual(await getTags({ cwd, options: { tagFormat: `\${version}` } }, [{ name: "master" }]), [
    { name: "master", tags: [{ gitTag: "1.0.0", version: "1.0.0", channels: [null] }] },
  ]);

  await gitTagVersion("foo-1.0.0-bar", undefined, { cwd });
  t.deepEqual(await getTags({ cwd, options: { tagFormat: `foo-\${version}-bar` } }, [{ name: "master" }]), [
    { name: "master", tags: [{ gitTag: "foo-1.0.0-bar", version: "1.0.0", channels: [null] }] },
  ]);

  await gitTagVersion("foo-v1.0.0-bar", undefined, { cwd });
  t.deepEqual(await getTags({ cwd, options: { tagFormat: `foo-v\${version}-bar` } }, [{ name: "master" }]), [
    {
      name: "master",
      tags: [{ gitTag: "foo-v1.0.0-bar", version: "1.0.0", channels: [null] }],
    },
  ]);

  await gitTagVersion("(.+)/1.0.0/(a-z)", undefined, { cwd });
  t.deepEqual(await getTags({ cwd, options: { tagFormat: `(.+)/\${version}/(a-z)` } }, [{ name: "master" }]), [
    {
      name: "master",
      tags: [{ gitTag: "(.+)/1.0.0/(a-z)", version: "1.0.0", channels: [null] }],
    },
  ]);

  await gitTagVersion("2.0.0-1.0.0-bar.1", undefined, { cwd });
  t.deepEqual(await getTags({ cwd, options: { tagFormat: `2.0.0-\${version}-bar.1` } }, [{ name: "master" }]), [
    {
      name: "master",
      tags: [{ gitTag: "2.0.0-1.0.0-bar.1", version: "1.0.0", channels: [null] }],
    },
  ]);

  await gitTagVersion("3.0.0-bar.2", undefined, { cwd });
  t.deepEqual(await getTags({ cwd, options: { tagFormat: `\${version}-bar.2` } }, [{ name: "master" }]), [
    {
      name: "master",
      tags: [{ gitTag: "3.0.0-bar.2", version: "3.0.0", channels: [null] }],
    },
  ]);

  await gitTagVersion("3.0.1-bar.2+buildnumber", undefined, { cwd });
  t.deepEqual(await getTags({ cwd, options: { tagFormat: `\${version}-bar.2` } }, [{ name: "master" }]), [
    {
      name: "master",
      tags: [
        { gitTag: "3.0.0-bar.2", version: "3.0.0", channels: [null] },
        { gitTag: "3.0.1-bar.2+buildnumber", version: "3.0.1", channels: [null] },
      ],
    },
  ]);
});

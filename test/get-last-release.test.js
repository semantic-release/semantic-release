import test from "ava";
import getLastRelease from "../lib/get-last-release.js";

test("Get the highest non-prerelease valid tag", (t) => {
  const result = getLastRelease({
    branch: {
      name: "master",
      tags: [
        { version: "2.0.0", gitTag: "v2.0.0", gitHead: "v2.0.0" },
        { version: "1.0.0", gitTag: "v1.0.0", gitHead: "v1.0.0" },
        { version: "3.0.0-beta.1", gitTag: "v3.0.0-beta.1", gitHead: "v3.0.0-beta.1" },
      ],
      type: "release",
    },
    options: { tagFormat: `v\${version}` },
  });

  t.deepEqual(result, { version: "2.0.0", gitTag: "v2.0.0", name: "v2.0.0", gitHead: "v2.0.0", channels: undefined });
});

test("Get the highest prerelease valid tag, ignoring other tags from other prerelease channels", (t) => {
  const result = getLastRelease({
    branch: {
      name: "beta",
      prerelease: "beta",
      channel: "beta",
      tags: [
        { version: "1.0.0-beta.1", gitTag: "v1.0.0-beta.1", gitHead: "v1.0.0-beta.1", channels: ["beta"] },
        { version: "1.0.0-beta.2", gitTag: "v1.0.0-beta.2", gitHead: "v1.0.0-beta.2", channels: ["beta"] },
        { version: "1.0.0-alpha.1", gitTag: "v1.0.0-alpha.1", gitHead: "v1.0.0-alpha.1", channels: ["alpha"] },
      ],
      type: "prerelease",
    },
    options: { tagFormat: `v\${version}` },
  });

  t.deepEqual(result, {
    version: "1.0.0-beta.2",
    gitTag: "v1.0.0-beta.2",
    name: "v1.0.0-beta.2",
    gitHead: "v1.0.0-beta.2",
    channels: ["beta"],
  });
});

test("Get the correct prerelease tag, when other prereleases share the same git HEAD", (t) => {
  const testConfig = {
    branch: {
      name: "alpha",
      prerelease: "alpha",
      channel: "alpha",
      tags: [
        { version: "1.0.0-beta.1", gitTag: "v1.0.0-beta.1", gitHead: "v1.0.0-beta.1", channels: ["beta"] },
        { version: "1.0.0-beta.2", gitTag: "v1.0.0-beta.2", gitHead: "v1.0.0-alpha.1", channels: ["alpha", "beta"] },
        { version: "1.0.0-alpha.1", gitTag: "v1.0.0-alpha.1", gitHead: "v1.0.0-alpha.1", channels: ["alpha", "beta"] },
      ],
      type: "prerelease",
    },
    options: { tagFormat: `v\${version}`, debug: true },
  };
  const firstResult = getLastRelease(testConfig);

  t.deepEqual(firstResult, {
    version: "1.0.0-alpha.1",
    gitTag: "v1.0.0-alpha.1",
    name: "v1.0.0-alpha.1",
    gitHead: "v1.0.0-alpha.1",
    channels: ["alpha", "beta"],
  });

  testConfig.branch.prerelease = true;
  const secondResult = getLastRelease(testConfig);

  t.deepEqual(secondResult, {
    version: "1.0.0-alpha.1",
    gitTag: "v1.0.0-alpha.1",
    name: "v1.0.0-alpha.1",
    gitHead: "v1.0.0-alpha.1",
    channels: ["alpha", "beta"],
  });
});

test("Get the highest prerelease valid tag when prerelease identifier contains dots", (t) => {
  const result = getLastRelease({
    branch: {
      name: "lts/AS2024.10",
      prerelease: "AS2024.10",
      channel: "lts/AS2024.10",
      tags: [
        {
          version: "1.705.3-AS2024.10.14",
          gitTag: "v1.705.3-AS2024.10.14",
          gitHead: "v1.705.3-AS2024.10.14",
          channels: ["lts/AS2024.10"],
        },
        {
          version: "1.705.3-AS2024.10.15",
          gitTag: "v1.705.3-AS2024.10.15",
          gitHead: "v1.705.3-AS2024.10.15",
          channels: ["lts/AS2024.10"],
        },
        {
          version: "1.705.3-AS2024.11.1",
          gitTag: "v1.705.3-AS2024.11.1",
          gitHead: "v1.705.3-AS2024.11.1",
          channels: ["lts/AS2024.11"],
        },
      ],
      type: "prerelease",
    },
    options: { tagFormat: `v\${version}` },
  });

  t.deepEqual(result, {
    version: "1.705.3-AS2024.10.15",
    gitTag: "v1.705.3-AS2024.10.15",
    name: "v1.705.3-AS2024.10.15",
    gitHead: "v1.705.3-AS2024.10.15",
    channels: ["lts/AS2024.10"],
  });
});

test("Return empty object if no valid tag is found", (t) => {
  const result = getLastRelease({
    branch: {
      name: "master",
      tags: [{ version: "3.0.0-beta.1", gitTag: "v3.0.0-beta.1", gitHead: "v3.0.0-beta.1" }],
      type: "release",
    },
    options: { tagFormat: `v\${version}` },
  });

  t.deepEqual(result, {});
});

test("Get the highest non-prerelease valid tag before a certain version", (t) => {
  const result = getLastRelease(
    {
      branch: {
        name: "master",
        channel: undefined,
        tags: [
          { version: "2.0.0", gitTag: "v2.0.0", gitHead: "v2.0.0" },
          { version: "1.0.0", gitTag: "v1.0.0", gitHead: "v1.0.0" },
          { version: "2.0.0-beta.1", gitTag: "v2.0.0-beta.1", gitHead: "v2.0.0-beta.1" },
          { version: "2.1.0", gitTag: "v2.1.0", gitHead: "v2.1.0" },
          { version: "2.1.1", gitTag: "v2.1.1", gitHead: "v2.1.1" },
        ],
        type: "release",
      },
      options: { tagFormat: `v\${version}` },
    },
    { before: "2.1.0" }
  );

  t.deepEqual(result, { version: "2.0.0", gitTag: "v2.0.0", name: "v2.0.0", gitHead: "v2.0.0", channels: undefined });
});

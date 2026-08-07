import test from "ava";
import { EGITNOPERMISSION } from "../../lib/definitions/errors.js";

test("EGITNOPERMISSION does not expose the authenticated repository URL", (t) => {
  const error = EGITNOPERMISSION({
    options: {
      originalRepositoryURL: "https://github.com/owner/repo.git",
      repositoryUrl: "https://x-access-token:secret-token@github.com/owner/repo.git",
    },
    branch: { name: "master" },
  });

  t.true(error.details.includes("https://github.com/owner/repo.git"));
  t.false(error.details.includes("secret-token"));
});

test("EGITNOPERMISSION falls back to the repository URL if the original URL is not available", (t) => {
  const error = EGITNOPERMISSION({
    options: { repositoryUrl: "https://github.com/owner/repo.git" },
    branch: { name: "master" },
  });

  t.true(error.details.includes("https://github.com/owner/repo.git"));
});

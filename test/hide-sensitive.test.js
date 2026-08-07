import { format, parse } from "node:url";
import test from "ava";
import { repeat } from "lodash-es";
import hideSensitive from "../lib/hide-sensitive.js";
import { SECRET_MIN_SIZE, SECRET_REPLACEMENT } from "../lib/definitions/constants.js";

test("Replace multiple sensitive environment variable values", (t) => {
  const env = { SOME_PASSWORD: "password", SOME_TOKEN: "secret" };
  t.is(
    hideSensitive(env)(`https://user:${env.SOME_PASSWORD}@host.com?token=${env.SOME_TOKEN}`),
    `https://user:${SECRET_REPLACEMENT}@host.com?token=${SECRET_REPLACEMENT}`
  );
});

test("Replace multiple occurrences of sensitive environment variable values", (t) => {
  const env = { secretKey: "secret" };
  t.is(
    hideSensitive(env)(`https://user:${env.secretKey}@host.com?token=${env.secretKey}`),
    `https://user:${SECRET_REPLACEMENT}@host.com?token=${SECRET_REPLACEMENT}`
  );
});

test('Replace sensitive environment variable matching specific regex for "private"', (t) => {
  const env = { privateKey: "secret", GOPRIVATE: "host.com" };
  t.is(hideSensitive(env)(`https://host.com?token=${env.privateKey}`), `https://host.com?token=${SECRET_REPLACEMENT}`);
});

test("Replace url-encoded environment variable", (t) => {
  const env = { privateKey: "secret " };
  t.is(
    hideSensitive(env)(`https://host.com?token=${encodeURI(env.privateKey)}`),
    `https://host.com?token=${SECRET_REPLACEMENT}`
  );
});

test("Escape regexp special characters", (t) => {
  const env = { SOME_CREDENTIALS: "p$^{.+}\\w[a-z]o.*rd" };
  t.is(
    hideSensitive(env)(`https://user:${env.SOME_CREDENTIALS}@host.com`),
    `https://user:${SECRET_REPLACEMENT}@host.com`
  );
});

test("Escape regexp special characters in url-encoded environment variable", (t) => {
  const env = { SOME_PASSWORD: "secret password p$^{.+}\\w[a-z]o.*rd)(" };
  t.is(
    hideSensitive(env)(`https://user:${encodeURI(env.SOME_PASSWORD)}@host.com`),
    `https://user:${SECRET_REPLACEMENT}@host.com`
  );
});

test('Accept "undefined" input', (t) => {
  t.is(hideSensitive({})(), undefined);
});

test("Return same string if no environment variable has to be replaced", (t) => {
  t.is(hideSensitive({})("test"), "test");
});

test("Exclude empty environment variables from the regexp", (t) => {
  const env = { SOME_PASSWORD: "password", SOME_TOKEN: "" };
  t.is(
    hideSensitive(env)(`https://user:${env.SOME_PASSWORD}@host.com?token=`),
    `https://user:${SECRET_REPLACEMENT}@host.com?token=`
  );
});

test("Exclude empty environment variables from the regexp if there is only empty ones", (t) => {
  t.is(hideSensitive({ SOME_PASSWORD: "", SOME_TOKEN: " \n " })(`https://host.com?token=`), "https://host.com?token=");
});

test("Exclude nonsensitive GOPRIVATE environment variable for Golang projects from the regexp", (t) => {
  const env = { GOPRIVATE: "host.com" };
  t.is(hideSensitive(env)(`https://host.com?token=`), "https://host.com?token=");
});

test("Exclude environment variables with value shorter than SECRET_MIN_SIZE from the regexp", (t) => {
  const SHORT_TOKEN = repeat("a", SECRET_MIN_SIZE - 1);
  const LONG_TOKEN = repeat("b", SECRET_MIN_SIZE);
  const env = { SHORT_TOKEN, LONG_TOKEN };
  t.is(
    hideSensitive(env)(`https://user:${SHORT_TOKEN}@host.com?token=${LONG_TOKEN}`),
    `https://user:${SHORT_TOKEN}@host.com?token=${SECRET_REPLACEMENT}`
  );
});

// `lib/get-git-auth-url.js` embeds credentials in the repository URL with `url.format()`, which
// encodes the `auth` field like `encodeURIComponent()` except that `:` separators are kept as is.
// Build the URLs asserted below the same way, so they match what a failing git command prints.
const gitAuthUrl = (auth) => format({ ...parse("https://host.com/owner/repo.git"), auth });

for (const character of ["@", "/", "?", "&", "=", "#", " "]) {
  test(`Mask GIT_CREDENTIALS containing "${character}" in a git authentication URL`, (t) => {
    const env = { GIT_CREDENTIALS: `user:abc${character}def-secret` };
    t.is(hideSensitive(env)(gitAuthUrl(env.GIT_CREDENTIALS)), `https://${SECRET_REPLACEMENT}@host.com/owner/repo.git`);
  });
}

test("Mask GIT_CREDENTIALS containing multiple `:` in a git authentication URL", (t) => {
  const env = { GIT_CREDENTIALS: "user:pa:ss@word-secret" };
  t.is(hideSensitive(env)(gitAuthUrl(env.GIT_CREDENTIALS)), `https://${SECRET_REPLACEMENT}@host.com/owner/repo.git`);
});

test("Mask GITHUB_TOKEN containing reserved characters in a git authentication URL", (t) => {
  const env = { GITHUB_TOKEN: "ghp_abc@def/secret?x=1&y=2" };
  t.is(
    hideSensitive(env)(gitAuthUrl(`x-access-token:${env.GITHUB_TOKEN}`)),
    `https://x-access-token:${SECRET_REPLACEMENT}@host.com/owner/repo.git`
  );
});

test("Mask GH_TOKEN containing reserved characters in a git authentication URL", (t) => {
  const env = { GH_TOKEN: "ghp_abc@def-secret" };
  t.is(hideSensitive(env)(gitAuthUrl(env.GH_TOKEN)), `https://${SECRET_REPLACEMENT}@host.com/owner/repo.git`);
});

test("Mask GL_TOKEN containing `:` and reserved characters in a git authentication URL", (t) => {
  const env = { GL_TOKEN: "glpat-abc:def@x-secret" };
  t.is(
    hideSensitive(env)(gitAuthUrl(`gitlab-ci-token:${env.GL_TOKEN}`)),
    `https://gitlab-ci-token:${SECRET_REPLACEMENT}@host.com/owner/repo.git`
  );
});

test("Mask fully percent-encoded secrets", (t) => {
  const env = { SOME_PASSWORD: "user:pass@word-secret" };
  t.is(hideSensitive(env)(`token=${encodeURIComponent(env.SOME_PASSWORD)}`), `token=${SECRET_REPLACEMENT}`);
});

test("Mask multiple secrets with reserved characters", (t) => {
  const env = { SOME_PASSWORD: "pass@word", SOME_TOKEN: "token/value" };
  t.is(
    hideSensitive(env)(
      `https://user:${encodeURIComponent(env.SOME_PASSWORD)}@host.com?token=${encodeURIComponent(env.SOME_TOKEN)}`
    ),
    `https://user:${SECRET_REPLACEMENT}@host.com?token=${SECRET_REPLACEMENT}`
  );
});

test("Mask encoded credentials in git command output", (t) => {
  const env = { GIT_CREDENTIALS: "user:abc@def-secret" };
  const gitError = `git ls-remote --heads '${gitAuthUrl(env.GIT_CREDENTIALS)}'`;
  t.is(hideSensitive(env)(gitError), `git ls-remote --heads 'https://${SECRET_REPLACEMENT}@host.com/owner/repo.git'`);
});

test("Mask multiple occurrences of encoded credentials", (t) => {
  const env = { secretKey: "abc@def-secret" };
  t.is(
    hideSensitive(env)(`url1: ${gitAuthUrl(env.secretKey)} url2: ${gitAuthUrl(env.secretKey)}`),
    `url1: https://${SECRET_REPLACEMENT}@host.com/owner/repo.git url2: https://${SECRET_REPLACEMENT}@host.com/owner/repo.git`
  );
});

test("Mask API_KEY values", (t) => {
  const env = { API_KEY: "SUPER-SECRET-VALUE-API_KEY" };
  t.is(hideSensitive(env)(`leaked value: ${env.API_KEY}`), `leaked value: ${SECRET_REPLACEMENT}`);
});

test("Mask AUTH values", (t) => {
  const env = { BASIC_AUTH: "SUPER-SECRET-VALUE-BASIC_AUTH" };
  t.is(hideSensitive(env)(`leaked value: ${env.BASIC_AUTH}`), `leaked value: ${SECRET_REPLACEMENT}`);
});

test("Mask WEBHOOK values", (t) => {
  const env = { SLACK_WEBHOOK: "SUPER-SECRET-VALUE-SLACK_WEBHOOK" };
  t.is(hideSensitive(env)(`leaked value: ${env.SLACK_WEBHOOK}`), `leaked value: ${SECRET_REPLACEMENT}`);
});

test("Mask AWS_ACCESS_KEY_ID values", (t) => {
  const env = { AWS_ACCESS_KEY_ID: "SUPER-SECRET-VALUE-AWS_ACCESS_KEY_ID" };
  t.is(hideSensitive(env)(`leaked value: ${env.AWS_ACCESS_KEY_ID}`), `leaked value: ${SECRET_REPLACEMENT}`);
});

test("Mask fully percent-encoded API_KEY values", (t) => {
  const env = { API_KEY: "user:pass@word-secret" };
  t.is(hideSensitive(env)(`key=${encodeURIComponent(env.API_KEY)}`), `key=${SECRET_REPLACEMENT}`);
});

test("Mask common key/auth/webhook env-var names from advisory", (t) => {
  for (const name of [
    "API_KEY",
    "DEPLOY_KEY",
    "SIGNING_KEY",
    "SSH_KEY",
    "ENCRYPTION_KEY",
    "AUTH",
    "BASIC_AUTH",
    "SLACK_WEBHOOK",
    "DOCKER_AUTH",
    "AWS_ACCESS_KEY_ID",
  ]) {
    const secretValue = `SUPER-SECRET-VALUE-${name}`;
    const env = { [name]: secretValue };
    t.false(hideSensitive(env)(`leaked value: ${secretValue}`).includes(secretValue), `${name} should be masked`);
  }
});

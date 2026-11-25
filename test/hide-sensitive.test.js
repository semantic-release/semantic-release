import test from "ava";

import hideSensitive from "../lib/hide-sensitive.js";

test("Git identity environment variables are not masked", (t) => {
  const hide = hideSensitive({
    GIT_AUTHOR_NAME: "Jane Doe",
    GIT_AUTHOR_EMAIL: "jane@example.com",
    GIT_COMMITTER_NAME: "Jane Doe",
    GIT_COMMITTER_EMAIL: "jane@example.com",
    CUSTOM_AUTH_TOKEN: "secret-value",
  });

  t.is(hide("Jane Doe <jane@example.com> secret-value"), "Jane Doe <jane@example.com> [secure]");
});

import { escapeRegExp, isString, size } from "lodash-es";
import { SECRET_MIN_SIZE, SECRET_REPLACEMENT } from "./definitions/constants.js";

export default (env) => {
  const toReplace = Object.keys(env).filter((envVar) => {
    // https://github.com/semantic-release/semantic-release/issues/1558
    if (envVar === "GOPRIVATE") {
      return false;
    }

    return (
      /token|password|credential|secret|private|key|auth|webhook/i.test(envVar) &&
      size(env[envVar].trim()) >= SECRET_MIN_SIZE
    );
  });

  const regexp = new RegExp(
    toReplace
      .flatMap((envVar) => {
        const value = env[envVar];
        const forms = new Set([
          value,
          encodeURI(value),
          encodeURIComponent(value),
          // The form emitted by `url.format()`, which `get-git-auth-url.js` uses to embed credentials
          // in the repository URL: like `encodeURIComponent()`, but `:` separators are kept as is
          value.split(":").map(encodeURIComponent).join(":"),
        ]);
        return [...forms].map(escapeRegExp);
      })
      .join("|"),
    "g"
  );
  return (output) =>
    output && isString(output) && toReplace.length > 0 ? output.toString().replace(regexp, SECRET_REPLACEMENT) : output;
};

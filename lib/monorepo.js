import { castArray, isNil, isPlainObject, isString } from "lodash-es";

/** The release may continue despite the failed push verification. */
export const PROCEED = "proceed";
/** The release must not happen. */
export const SKIP = "skip";
/** The failure is a permission problem, which is fatal. */
export const UNAUTHORIZED = "unauthorized";

/**
 * Normalize a configured path so it can be compared with the repository relative paths reported by git.
 *
 * @param {String} path The configured path.
 *
 * @return {String} The normalized path, empty when nothing is designated.
 */
export function normalizePath(path) {
  const normalized = path
    .trim()
    .replace(/^\.\//u, "")
    .replace(/^\/+/u, "")
    .replace(/\/+$/u, "")
    .replace(/\/\.$/u, "")
    .trim();

  // `.` and `./` designate the root of the repository. They are normalized to nothing so that, like an
  // empty path, they are reported as an invalid configuration rather than silently matching no file.
  return normalized === "." ? "" : normalized;
}

/**
 * Whether a raw `monorepo` option has a supported shape.
 *
 * @param {Boolean|Object} monorepo The raw `monorepo` option.
 *
 * @return {Boolean} `true` for `true`, or for an object with a string or string array `path`.
 */
export function isMonorepoConfigValid(monorepo) {
  if (monorepo === true) {
    return true;
  }

  if (!isPlainObject(monorepo)) {
    return false;
  }

  // An object without a `path`, such as `{}` or `{ path: null }`, behaves like `true` and infers the
  // path from the working directory.
  if (isNil(monorepo.path)) {
    return true;
  }

  return isString(monorepo.path) || (Array.isArray(monorepo.path) && monorepo.path.every(isString));
}

/**
 * Resolve the configured paths, inferring them from the location of the working directory inside the
 * repository when no explicit path is set.
 *
 * @param {Boolean|Object} monorepo The raw `monorepo` option.
 * @param {String} [cwdPrefix] The repository relative location of the working directory, with a trailing slash.
 *
 * @return {Array<String>} The normalized paths, empty when the option designates nothing usable.
 */
export function resolveMonorepoPaths(monorepo, cwdPrefix = "") {
  if (!isMonorepoConfigValid(monorepo)) {
    return [];
  }

  const configured = monorepo === true || isNil(monorepo.path) ? [cwdPrefix] : castArray(monorepo.path);

  return configured.map(normalizePath).filter(Boolean);
}

/**
 * Whether any of the files is inside one of the paths.
 *
 * A file matches when it is the path itself or when it lives under it, so `packages/a` matches
 * `packages/a/src/index.js` but not `packages/ab/index.js`.
 *
 * @param {Array<String>} files The changed files, relative to the repository root.
 * @param {Array<String>} paths The resolved paths.
 *
 * @return {Boolean} `true` when at least one file matches at least one path.
 */
export function matchesPaths(files, paths) {
  return files.some((file) => paths.some((path) => file === path || file.startsWith(`${path}/`)));
}

/**
 * Decide how to react to a failed push verification.
 *
 * @param {Object} state The observed state.
 * @param {Boolean} state.upToDate Whether the local HEAD is the remote HEAD.
 * @param {Array<String>|undefined} state.changedFiles The files changed between the local HEAD and the remote
 *   branch tip, `undefined` when they could not be determined.
 * @param {Array<String>} state.paths The resolved monorepo paths, empty when not configured.
 *
 * @return {{decision: String, reason: String}} The decision and the reason for it.
 */
export function decideOnFailedPush({ upToDate, changedFiles, paths }) {
  if (upToDate) {
    // Nothing is missing locally, so the failure cannot be a divergence: only the tag push checked by the
    // caller can tell whether the release may continue.
    return { decision: paths.length > 0 ? PROCEED : UNAUTHORIZED, reason: "up-to-date" };
  }

  if (paths.length === 0) {
    return { decision: SKIP, reason: "not-up-to-date" };
  }

  if (changedFiles === undefined) {
    return { decision: SKIP, reason: "undetermined" };
  }

  return matchesPaths(changedFiles, paths)
    ? { decision: SKIP, reason: "path-affected" }
    : { decision: PROCEED, reason: "path-unaffected" };
}

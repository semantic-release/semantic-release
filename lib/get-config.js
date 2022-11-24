import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { castArray, isNil, isPlainObject, isString, pickBy } from "lodash-es";
import { readPackageUp } from "read-pkg-up";
import { cosmiconfig } from "cosmiconfig";
import resolveFrom from "resolve-from";
import debugConfig from "debug";
import { repoUrl } from "./git.js";
import PLUGINS_DEFINITIONS from "./definitions/plugins.js";
import plugins from "./plugins/index.js";
import { parseConfig, validatePlugin } from "./plugins/utils.js";

const debug = debugConfig("semantic-release:config");
const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const CONFIG_NAME = "release";

export default async (context, cliOptions) => {
  const { cwd, env } = context;
  const { config, filepath } = (await cosmiconfig(CONFIG_NAME).search(cwd)) || {};

  debug("load config from: %s", filepath);

  // Merge config file options and CLI/API options
  let options = { ...config, ...cliOptions };

  const pluginsPath = {};
  let extendPaths;
  ({ extends: extendPaths, ...options } = options);
  if (extendPaths) {
    // If `extends` is defined, load and merge each shareable config with `options`
    options = {
      ...(await castArray(extendPaths).reduce(async (eventualResult, extendPath) => {
        const result = await eventualResult;
        const extendsOptions = require(resolveFrom.silent(__dirname, extendPath) || resolveFrom(cwd, extendPath));

        // For each plugin defined in a shareable config, save in `pluginsPath` the extendable config path,
        // so those plugin will be loaded relative to the config file
        Object.entries(extendsOptions)
          .filter(([, value]) => Boolean(value))
          .reduce((pluginsPath, [option, value]) => {
            castArray(value).forEach((plugin) => {
              if (option === "plugins" && validatePlugin(plugin)) {
                pluginsPath[parseConfig(plugin)[0]] = extendPath;
              } else if (
                PLUGINS_DEFINITIONS[option] &&
                (isString(plugin) || (isPlainObject(plugin) && isString(plugin.path)))
              ) {
                pluginsPath[isString(plugin) ? plugin : plugin.path] = extendPath;
              }
            });
            return pluginsPath;
          }, pluginsPath);

        return { ...result, ...extendsOptions };
      }, {})),
      ...options,
    };
  }

  // Set default options values if not defined yet
  options = {
    branches: [
      "+([0-9])?(.{+([0-9]),x}).x",
      "master",
      "next",
      "next-major",
      { name: "beta", prerelease: true },
      { name: "alpha", prerelease: true },
    ],
    repositoryUrl: (await pkgRepoUrl({ normalize: false, cwd })) || (await repoUrl({ cwd, env })),
    tagFormat: `v\${version}`,
    plugins: [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/npm",
      "@semantic-release/github",
    ],
    // Remove `null` and `undefined` options, so they can be replaced with default ones
    ...pickBy(options, (option) => !isNil(option)),
    ...(options.branches ? { branches: castArray(options.branches) } : {}),
  };

  if (options.ci === false) {
    options.noCi = true;
  }

  debug("options values: %O", options);

  return { options, plugins: await plugins({ ...context, options }, pluginsPath) };
};

async function pkgRepoUrl(options) {
  const { packageJson } = (await readPackageUp(options)) || {};
  return packageJson && (isPlainObject(packageJson.repository) ? packageJson.repository.url : packageJson.repository);
}

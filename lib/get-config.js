const {castArray, pickBy, isNil, isString, isPlainObject} = require('lodash');
const readPkgUp = require('read-pkg-up');
const {cosmiconfig} = require('cosmiconfig');
const resolveFrom = require('resolve-from');
const debug = require('debug')('semantic-release:config');
const {repoUrl} = require('./git');
const PLUGINS_DEFINITIONS = require('./definitions/plugins');
const plugins = require('./plugins');
const {validatePlugin, parseConfig} = require('./plugins/utils');

const CONFIG_NAME = 'release';

module.exports = async (context, cliOptions) => {
  const {cwd, env} = context;
  const {config, filepath} = (await cosmiconfig(CONFIG_NAME).search(cwd)) || {};

  debug('load config from: %s', filepath);

  // Merge config file options and CLI/API options
  let options = {...config, ...cliOptions};

  const pluginsPath = {};
  let extendPaths;
  ({extends: extendPaths, ...options} = options);
  if (extendPaths) {
    // If `extends` is defined, load and merge each shareable config with `options`
    options = {
      ...castArray(extendPaths).reduce((result, extendPath) => {
        const extendsOptions = require(resolveFrom.silent(__dirname, extendPath) || resolveFrom(cwd, extendPath));

        // For each plugin defined in a shareable config, save in `pluginsPath` the extendable config path,
        // so those plugin will be loaded relatively to the config file
        Object.entries(extendsOptions)
          .filter(([, value]) => Boolean(value))
          .reduce((pluginsPath, [option, value]) => {
            castArray(value).forEach((plugin) => {
              if (option === 'plugins' && validatePlugin(plugin)) {
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

        return {...result, ...extendsOptions};
      }, {}),
      ...options,
    };
  }

  // Set default options values if not defined yet
  options = {
    branches: [
      '+([0-9])?(.{+([0-9]),x}).x',
      'master',
      'next',
      'next-major',
      {name: 'beta', prerelease: true},
      {name: 'alpha', prerelease: true},
    ],
    repositoryUrl: (await pkgRepoUrl({normalize: false, cwd})) || (await repoUrl({cwd, env})),
    tagFormat: `v\${version}`,
    plugins: [
      '@semantic-release/commit-analyzer',
      '@semantic-release/release-notes-generator',
      '@semantic-release/npm',
      '@semantic-release/github',
    ],
    // Remove `null` and `undefined` options so they can be replaced with default ones
    ...pickBy(options, (option) => !isNil(option)),
    ...(options.branches ? {branches: castArray(options.branches)} : {}),
  };

  if (options.ci === false) {
    options.noCi = true;
  }

  debug('options values: %O', options);

  return {options, plugins: await plugins({...context, options}, pluginsPath)};
};

async function pkgRepoUrl(options) {
  const {packageJson} = (await readPkgUp(options)) || {};
  return packageJson && (isPlainObject(packageJson.repository) ? packageJson.repository.url : packageJson.repository);
}

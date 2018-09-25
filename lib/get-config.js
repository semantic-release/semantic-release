const {castArray, pickBy, isNil, isString, isPlainObject} = require('lodash');
const readPkgUp = require('read-pkg-up');
const cosmiconfig = require('cosmiconfig');
const resolveFrom = require('resolve-from');
const debug = require('debug')('semantic-release:config');
const {repoUrl} = require('./git');
const PLUGINS_DEFINITIONS = require('./definitions/plugins');
const plugins = require('./plugins');

const CONFIG_NAME = 'release';
const CONFIG_FILES = [
  'package.json',
  `.${CONFIG_NAME}rc`,
  `.${CONFIG_NAME}rc.json`,
  `.${CONFIG_NAME}rc.yaml`,
  `.${CONFIG_NAME}rc.yml`,
  `.${CONFIG_NAME}rc.js`,
  `${CONFIG_NAME}.config.js`,
];

module.exports = async (context, opts) => {
  const {cwd, env} = context;
  const {config} = (await cosmiconfig(CONFIG_NAME, {searchPlaces: CONFIG_FILES}).search(cwd)) || {};
  // Merge config file options and CLI/API options
  let options = {...config, ...opts};
  const pluginsPath = {};
  let extendPaths;
  ({extends: extendPaths, ...options} = options);
  if (extendPaths) {
    // If `extends` is defined, load and merge each shareable config with `options`
    options = {
      ...castArray(extendPaths).reduce((result, extendPath) => {
        const extendsOpts = require(resolveFrom.silent(__dirname, extendPath) || resolveFrom(cwd, extendPath));

        // For each plugin defined in a shareable config, save in `pluginsPath` the extendable config path,
        // so those plugin will be loaded relatively to the config file
        Object.entries(extendsOpts).reduce((pluginsPath, [option, value]) => {
          if (PLUGINS_DEFINITIONS[option] || option === 'plugins') {
            castArray(value)
              .filter(plugin => isString(plugin) || (isPlainObject(plugin) && isString(plugin.path)))
              .map(plugin => (isString(plugin) ? plugin : plugin.path))
              .forEach(plugin => {
                pluginsPath[plugin] = extendPath;
              });
          }
          return pluginsPath;
        }, pluginsPath);

        return {...result, ...extendsOpts};
      }, {}),
      ...options,
    };
  }

  // Set default options values if not defined yet
  options = {
    branch: 'master',
    repositoryUrl: (await pkgRepoUrl({normalize: false, cwd})) || (await repoUrl({cwd, env})),
    tagFormat: `v\${version}`,
    plugins: [
      '@semantic-release/commit-analyzer',
      '@semantic-release/release-notes-generator',
      '@semantic-release/npm',
      '@semantic-release/github',
    ],
    // Remove `null` and `undefined` options so they can be replaced with default ones
    ...pickBy(options, option => !isNil(option)),
  };

  debug('options values: %O', options);

  return {options, plugins: await plugins({...context, options}, pluginsPath)};
};

async function pkgRepoUrl(opts) {
  const {pkg} = await readPkgUp(opts);
  return pkg && (isPlainObject(pkg.repository) ? pkg.repository.url : pkg.repository);
}

const readPkgUp = require('read-pkg-up');
const {castArray, pickBy, isUndefined, isNull, isString, isPlainObject} = require('lodash');
const cosmiconfig = require('cosmiconfig');
const resolveFrom = require('resolve-from');
const SemanticReleaseError = require('@semantic-release/error');
const debug = require('debug')('semantic-release:config');
const {repoUrl} = require('./git');
const PLUGINS_DEFINITION = require('./plugins/definitions');
const plugins = require('./plugins');

module.exports = async (opts, logger) => {
  const {config} = (await cosmiconfig('release', {rcExtensions: true}).load(process.cwd())) || {};
  // Merge config file options and CLI/API options
  let options = {...config, ...opts};
  const pluginsPath = {};
  let extendPaths;
  ({extends: extendPaths, ...options} = options);
  if (extendPaths) {
    // If `extends` is defined, load and merge each shareable config with `options`
    options = {
      ...castArray(extendPaths).reduce((result, extendPath) => {
        const extendsOpts = require(resolveFrom.silent(__dirname, extendPath) ||
          resolveFrom(process.cwd(), extendPath));

        // For each plugin defined in a shareable config, save in `pluginsPath` the extendable config path,
        // so those plugin will be loaded relatively to the config file
        Object.keys(extendsOpts).reduce((pluginsPath, option) => {
          if (PLUGINS_DEFINITION[option]) {
            castArray(extendsOpts[option])
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
    repositoryUrl: (await pkgRepoUrl()) || (await repoUrl()),
    // Remove `null` and `undefined` options so they can be replaced with default ones
    ...pickBy(options, option => !isUndefined(option) && !isNull(option)),
  };

  debug('options values: %O', Object.keys(options));
  debug('name: %O', options.name);
  debug('branch: %O', options.branch);
  debug('repositoryUrl: %O', options.repositoryUrl);
  debug('analyzeCommits: %O', options.analyzeCommits);
  debug('generateNotes: %O', options.generateNotes);
  debug('verifyConditions: %O', options.verifyConditions);
  debug('verifyRelease: %O', options.verifyRelease);
  debug('publish: %O', options.publish);

  if (!options.repositoryUrl) {
    throw new SemanticReleaseError('The repositoryUrl option is required', 'ENOREPOURL');
  }

  return {options, plugins: await plugins(options, pluginsPath, logger)};
};

async function pkgRepoUrl() {
  const {pkg} = await readPkgUp();
  return pkg && pkg.repository ? pkg.repository.url : undefined;
}

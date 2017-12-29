const {isString, isObject, isFunction, isArray} = require('lodash');
const semver = require('semver');

const RELEASE_TYPE = ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease'];
const validatePluginConfig = conf => isString(conf) || isString(conf.path) || isFunction(conf);

module.exports = {
  verifyConditions: {
    default: ['@semantic-release/npm', '@semantic-release/github'],
    config: {
      validator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
      message:
        'The "verifyConditions" plugin, if defined, must be a single or an array of plugins definition. A plugin definition is either a string or an object with a path property.',
    },
  },
  getLastRelease: {
    default: '@semantic-release/npm',
    config: {
      validator: conf => Boolean(conf) && validatePluginConfig(conf),
      message:
        'The "getLastRelease" plugin is mandatory, and must be a single plugin definition. A plugin definition is either a string or an object with a path property.',
    },
    output: {
      validator: output =>
        !output ||
        (isObject(output) && !output.version) ||
        (isString(output.version) && Boolean(semver.valid(semver.clean(output.version))) && Boolean(output.gitHead)),
      message:
        'The "getLastRelease" plugin output if defined, must be an object with a valid semver version in the "version" property and the corresponding git reference in "gitHead" property.',
    },
  },
  analyzeCommits: {
    default: '@semantic-release/commit-analyzer',
    config: {
      validator: conf => Boolean(conf) && validatePluginConfig(conf),
      message:
        'The "analyzeCommits" plugin is mandatory, and must be a single plugin definition. A plugin definition is either a string or an object with a path property.',
    },
    output: {
      validator: output => !output || RELEASE_TYPE.includes(output),
      message: 'The "analyzeCommits" plugin output, if defined, must be a valid semver release type.',
    },
  },
  verifyRelease: {
    default: false,
    config: {
      validator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
      message:
        'The "verifyRelease" plugin, if defined, must be a single or an array of plugins definition. A plugin definition is either a string or an object with a path property.',
    },
  },
  generateNotes: {
    default: '@semantic-release/release-notes-generator',
    config: {
      validator: conf => !conf || validatePluginConfig(conf),
      message:
        'The "generateNotes" plugin, if defined, must be a single plugin definition. A plugin definition is either a string or an object with a path property.',
    },
    output: {
      validator: output => !output || isString(output),
      message: 'The "generateNotes" plugin output, if defined, must be a string.',
    },
  },
  publish: {
    default: ['@semantic-release/npm', '@semantic-release/github'],
    config: {
      validator: conf => Boolean(conf) && (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
      message:
        'The "publish" plugin is mandatory, and must be a single or an array of plugins definition. A plugin definition is either a string or an object with a path property.',
    },
  },
};

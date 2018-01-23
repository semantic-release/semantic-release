const {isString, isFunction, isArray} = require('lodash');

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

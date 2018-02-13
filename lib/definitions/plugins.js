const {isString, isFunction, isArray, isPlainObject} = require('lodash');
const RELEASE_TYPE = require('./release-types');

const validatePluginConfig = conf => isString(conf) || isString(conf.path) || isFunction(conf);

module.exports = {
  verifyConditions: {
    default: ['@semantic-release/npm', '@semantic-release/github'],
    config: {
      validator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    },
  },
  analyzeCommits: {
    default: '@semantic-release/commit-analyzer',
    config: {
      validator: conf => Boolean(conf) && validatePluginConfig(conf),
    },
    output: {
      validator: output => !output || RELEASE_TYPE.includes(output),
      error: 'EANALYZEOUTPUT',
    },
  },
  verifyRelease: {
    default: false,
    config: {
      validator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    },
  },
  generateNotes: {
    default: '@semantic-release/release-notes-generator',
    config: {
      validator: conf => !conf || validatePluginConfig(conf),
    },
    output: {
      validator: output => !output || isString(output),
      error: 'ERELEASENOTESOUTPUT',
    },
  },
  publish: {
    default: ['@semantic-release/npm', '@semantic-release/github'],
    config: {
      validator: conf => Boolean(conf) && (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    },
    output: {
      validator: output => !output || isPlainObject(output),
      error: 'EPUBLISHOUTPUT',
    },
  },
  success: {
    default: false,
    config: {
      validator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    },
  },
  fail: {
    default: false,
    config: {
      validator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    },
  },
};

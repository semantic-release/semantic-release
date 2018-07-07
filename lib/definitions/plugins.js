const {isString, isFunction, isArray, isPlainObject} = require('lodash');
const {RELEASE_TYPE} = require('./constants');

const validatePluginConfig = conf => isString(conf) || isString(conf.path) || isFunction(conf);

module.exports = {
  verifyConditions: {
    default: ['@semantic-release/npm', '@semantic-release/github'],
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
  },
  analyzeCommits: {
    default: '@semantic-release/commit-analyzer',
    configValidator: conf => Boolean(conf) && validatePluginConfig(conf),
    outputValidator: output => !output || RELEASE_TYPE.includes(output),
  },
  verifyRelease: {
    default: false,
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
  },
  generateNotes: {
    default: ['@semantic-release/release-notes-generator'],
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    outputValidator: output => !output || isString(output),
  },
  prepare: {
    default: ['@semantic-release/npm'],
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
  },
  publish: {
    default: ['@semantic-release/npm', '@semantic-release/github'],
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    outputValidator: output => !output || isPlainObject(output),
  },
  success: {
    default: ['@semantic-release/github'],
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
  },
  fail: {
    default: ['@semantic-release/github'],
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
  },
};

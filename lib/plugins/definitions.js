const {isString, isObject, isFunction, isArray} = require('lodash');
const semver = require('semver');
const conditionTravis = require('@semantic-release/condition-travis');
const commitAnalyzer = require('@semantic-release/commit-analyzer');
const releaseNotesGenerator = require('@semantic-release/release-notes-generator');
const npm = require('@semantic-release/npm');
const github = require('@semantic-release/github');

const RELEASE_TYPE = ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease'];

module.exports = {
  verifyConditions: {
    default: [npm.verifyConditions, github.verifyConditions, conditionTravis],
    config: {
      validator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
      message:
        'The "verifyConditions" plugin, if defined, must be a single or an array of plugins definition. A plugin definition is either a string or an object with a path property.',
    },
  },
  getLastRelease: {
    default: npm.getLastRelease,
    config: {
      validator: conf => Boolean(conf) && validatePluginConfig(conf),
      message:
        'The "getLastRelease" plugin is mandatory, and must be a single plugin definition. A plugin definition is either a string or an object with a path property.',
    },
    output: {
      validator: output =>
        !output ||
        (isObject(output) && !output.version) ||
        (isString(output.version) && Boolean(semver.valid(semver.clean(output.version)))),
      message:
        'The "getLastRelease" plugin output if defined, must be an object with an optionnal valid semver version in the "version" property.',
    },
  },
  analyzeCommits: {
    default: commitAnalyzer,
    config: {
      validator: conf => Boolean(conf) && validatePluginConfig(conf),
      message:
        'The "analyzeCommits" plugin is mandatory, and must be a single plugin definition. A plugin definition is either a string or an object with a path property.',
    },
    output: {
      validator: output => !output || RELEASE_TYPE.includes(output),
      message: 'The "analyzeCommits" plugin output must be either undefined or a valid semver release type.',
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
    default: releaseNotesGenerator,
    config: {
      validator: conf => !conf || validatePluginConfig(conf),
      message:
        'The "generateNotes" plugin, if defined, must be a single plugin definition. A plugin definition is either a string or an object with a path property.',
    },
    output: {
      validator: output => isString(output),
      message: 'The "generateNotes" plugin output must be a string.',
    },
  },
  publish: {
    default: [npm.publish, github.publish],
    config: {
      validator: conf => Boolean(conf) && (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
      message:
        'The "publish" plugin is mandatory, and must be a single or an array of plugins definition. A plugin definition is either a string or an object with a path property.',
    },
  },
};

const validatePluginConfig = conf => isString(conf) || isString(conf.path) || isFunction(conf);

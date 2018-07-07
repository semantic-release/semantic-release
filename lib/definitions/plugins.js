const {isString, isFunction, isArray, isPlainObject} = require('lodash');
const {gitHead} = require('../git');
const {RELEASE_TYPE, RELEASE_NOTES_SEPARATOR} = require('./constants');

const validatePluginConfig = conf => isString(conf) || isString(conf.path) || isFunction(conf);

module.exports = {
  verifyConditions: {
    default: ['@semantic-release/npm', '@semantic-release/github'],
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    pipelineConfig: () => ({settleAll: true}),
  },
  analyzeCommits: {
    default: '@semantic-release/commit-analyzer',
    configValidator: conf => Boolean(conf) && validatePluginConfig(conf),
    outputValidator: output => !output || RELEASE_TYPE.includes(output),
    preprocess: ({commits, ...inputs}) => ({
      ...inputs,
      commits: commits.filter(commit => !/\[skip\s+release\]|\[release\s+skip\]/i.test(commit.message)),
    }),
    postprocess: ([result]) => result,
  },
  verifyRelease: {
    default: false,
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    pipelineConfig: () => ({settleAll: true}),
  },
  generateNotes: {
    default: ['@semantic-release/release-notes-generator'],
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    outputValidator: output => !output || isString(output),
    pipelineConfig: () => ({
      getNextInput: ({nextRelease, ...generateNotesParam}, notes) => ({
        ...generateNotesParam,
        nextRelease: {
          ...nextRelease,
          notes: `${nextRelease.notes ? `${nextRelease.notes}${RELEASE_NOTES_SEPARATOR}` : ''}${notes}`,
        },
      }),
    }),
    postprocess: results => results.filter(Boolean).join(RELEASE_NOTES_SEPARATOR),
  },
  prepare: {
    default: ['@semantic-release/npm'],
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    pipelineConfig: ({generateNotes}, logger) => ({
      getNextInput: async ({nextRelease, ...prepareParam}) => {
        const newGitHead = await gitHead();
        // If previous prepare plugin has created a commit (gitHead changed)
        if (nextRelease.gitHead !== newGitHead) {
          nextRelease.gitHead = newGitHead;
          // Regenerate the release notes
          logger.log('Call plugin %s', 'generateNotes');
          nextRelease.notes = await generateNotes({nextRelease, ...prepareParam});
        }
        // Call the next publish plugin with the updated `nextRelease`
        return {...prepareParam, nextRelease};
      },
    }),
  },
  publish: {
    default: ['@semantic-release/npm', '@semantic-release/github'],
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    outputValidator: output => !output || isPlainObject(output),
    pipelineConfig: () => ({
      // Add `nextRelease` and plugin properties to published release
      transform: (release, step, {nextRelease}) => ({
        ...(isPlainObject(release) ? release : {}),
        ...nextRelease,
        ...step,
      }),
    }),
  },
  success: {
    default: ['@semantic-release/github'],
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    pipelineConfig: () => ({settleAll: true}),
  },
  fail: {
    default: ['@semantic-release/github'],
    configValidator: conf => !conf || (isArray(conf) ? conf : [conf]).every(conf => validatePluginConfig(conf)),
    pipelineConfig: () => ({settleAll: true}),
  },
};

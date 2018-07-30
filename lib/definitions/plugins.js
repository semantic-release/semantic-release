const {isString, isPlainObject} = require('lodash');
const {gitHead} = require('../git');
const {RELEASE_TYPE, RELEASE_NOTES_SEPARATOR} = require('./constants');

module.exports = {
  verifyConditions: {
    default: ['@semantic-release/npm', '@semantic-release/github'],
    multiple: true,
    required: false,
    pipelineConfig: () => ({settleAll: true}),
  },
  analyzeCommits: {
    default: '@semantic-release/commit-analyzer',
    multiple: false,
    required: true,
    outputValidator: output => !output || RELEASE_TYPE.includes(output),
    preprocess: ({commits, ...inputs}) => ({
      ...inputs,
      commits: commits.filter(commit => !/\[skip\s+release\]|\[release\s+skip\]/i.test(commit.message)),
    }),
    postprocess: ([result]) => result,
  },
  verifyRelease: {
    default: false,
    multiple: true,
    required: false,
    pipelineConfig: () => ({settleAll: true}),
  },
  generateNotes: {
    default: ['@semantic-release/release-notes-generator'],
    multiple: true,
    required: false,
    outputValidator: output => !output || isString(output),
    pipelineConfig: () => ({
      getNextInput: ({nextRelease, ...context}, notes) => ({
        ...context,
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
    multiple: true,
    required: false,
    pipelineConfig: ({generateNotes}, logger) => ({
      getNextInput: async context => {
        const newGitHead = await gitHead({cwd: context.cwd});
        // If previous prepare plugin has created a commit (gitHead changed)
        if (context.nextRelease.gitHead !== newGitHead) {
          context.nextRelease.gitHead = newGitHead;
          // Regenerate the release notes
          logger.log('Call plugin %s', 'generateNotes');
          context.nextRelease.notes = await generateNotes(context);
        }
        // Call the next prepare plugin with the updated `nextRelease`
        return context;
      },
    }),
  },
  publish: {
    default: ['@semantic-release/npm', '@semantic-release/github'],
    multiple: true,
    required: false,
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
    multiple: true,
    required: false,
    pipelineConfig: () => ({settleAll: true}),
  },
  fail: {
    default: ['@semantic-release/github'],
    multiple: true,
    required: false,
    pipelineConfig: () => ({settleAll: true}),
  },
};

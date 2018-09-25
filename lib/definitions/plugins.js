const {isString, isPlainObject} = require('lodash');
const {gitHead} = require('../git');
const hideSensitive = require('../hide-sensitive');
const {hideSensitiveValues} = require('../utils');
const {RELEASE_TYPE, RELEASE_NOTES_SEPARATOR} = require('./constants');

module.exports = {
  verifyConditions: {
    multiple: true,
    required: false,
    pipelineConfig: () => ({settleAll: true}),
  },
  analyzeCommits: {
    default: ['@semantic-release/commit-analyzer'],
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
    multiple: true,
    required: false,
    pipelineConfig: () => ({settleAll: true}),
  },
  generateNotes: {
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
    postprocess: (results, {env}) => hideSensitive(env)(results.filter(Boolean).join(RELEASE_NOTES_SEPARATOR)),
  },
  prepare: {
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
    multiple: true,
    required: false,
    pipelineConfig: () => ({settleAll: true}),
    preprocess: ({releases, env, ...inputs}) => ({...inputs, env, releases: hideSensitiveValues(env, releases)}),
  },
  fail: {
    multiple: true,
    required: false,
    pipelineConfig: () => ({settleAll: true}),
    preprocess: ({errors, env, ...inputs}) => ({...inputs, env, errors: hideSensitiveValues(env, errors)}),
  },
};

/* eslint require-atomic-updates: off */

import { isPlainObject, isString } from "lodash-es";
import { getGitHead } from "../git.js";
import hideSensitive from "../hide-sensitive.js";
import { hideSensitiveValues } from "../utils.js";
import { RELEASE_NOTES_SEPARATOR, RELEASE_TYPE } from "./constants.js";

export default {
  verifyConditions: {
    required: false,
    dryRun: true,
    pipelineConfig: () => ({ settleAll: true }),
  },
  analyzeCommits: {
    default: ["@semantic-release/commit-analyzer"],
    required: true,
    dryRun: true,
    outputValidator: (output) => !output || RELEASE_TYPE.includes(output),
    preprocess: ({ commits, ...inputs }) => ({
      ...inputs,
      commits: commits.filter((commit) => !/\[skip\s+release]|\[release\s+skip]/i.test(commit.message)),
    }),
    postprocess: (results) =>
      RELEASE_TYPE[
        results.reduce((highest, result) => {
          const typeIndex = RELEASE_TYPE.indexOf(result);
          return typeIndex > highest ? typeIndex : highest;
        }, -1)
      ],
  },
  verifyRelease: {
    required: false,
    dryRun: true,
    pipelineConfig: () => ({ settleAll: true }),
  },
  generateNotes: {
    required: false,
    dryRun: true,
    outputValidator: (output) => !output || isString(output),
    pipelineConfig: () => ({
      getNextInput: ({ nextRelease, ...context }, notes) => ({
        ...context,
        nextRelease: {
          ...nextRelease,
          notes: `${nextRelease.notes ? `${nextRelease.notes}${RELEASE_NOTES_SEPARATOR}` : ""}${notes}`,
        },
      }),
    }),
    postprocess: (results, { env }) => hideSensitive(env)(results.filter(Boolean).join(RELEASE_NOTES_SEPARATOR)),
  },
  prepare: {
    required: false,
    dryRun: false,
    pipelineConfig: ({ generateNotes }) => ({
      getNextInput: async (context) => {
        const newGitHead = await getGitHead({ cwd: context.cwd });
        // If previous prepare plugin has created a commit (gitHead changed)
        if (context.nextRelease.gitHead !== newGitHead) {
          context.nextRelease.gitHead = newGitHead;
          // Regenerate the release notes
          context.nextRelease.notes = await generateNotes(context);
        }

        // Call the next prepare plugin with the updated `nextRelease`
        return context;
      },
    }),
  },
  publish: {
    required: false,
    dryRun: false,
    outputValidator: (output) => !output || isPlainObject(output),
    pipelineConfig: () => ({
      // Add `nextRelease` and plugin properties to published release
      transform: (release, step, { nextRelease }) => ({
        ...(release === false ? {} : nextRelease),
        ...release,
        ...step,
      }),
    }),
  },
  addChannel: {
    required: false,
    dryRun: false,
    outputValidator: (output) => !output || isPlainObject(output),
    pipelineConfig: () => ({
      // Add `nextRelease` and plugin properties to published release
      transform: (release, step, { nextRelease }) => ({
        ...(release === false ? {} : nextRelease),
        ...release,
        ...step,
      }),
    }),
  },
  success: {
    required: false,
    dryRun: false,
    pipelineConfig: () => ({ settleAll: true }),
    preprocess: ({ releases, env, ...inputs }) => ({ ...inputs, env, releases: hideSensitiveValues(env, releases) }),
  },
  fail: {
    required: false,
    dryRun: false,
    pipelineConfig: () => ({ settleAll: true }),
    preprocess: ({ errors, env, ...inputs }) => ({ ...inputs, env, errors: hideSensitiveValues(env, errors) }),
  },
};

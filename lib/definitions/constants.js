export const SECRET_REPLACEMENT = "[secure]";

export const SECRET_MIN_SIZE = 5;

export const GIT_NOTE_REF = "semantic-release";

export const SEMANTIC_RELEASE_DEFAULT_CONFIG = {
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/github",
  ],
};

# Supported Branching Models

## Trunk Based Development

- https://trunkbaseddevelopment.com/
- https://minimumcd.org/minimumcd/tbd/

### Committing Straight to the Trunk

- https://trunkbaseddevelopment.com/#trunk-based-development-for-smaller-teams
- https://trunkbaseddevelopment.com/committing-straight-to-the-trunk/

### Short-Lived Feature Branches

- https://trunkbaseddevelopment.com/#scaled-trunk-based-development
- https://trunkbaseddevelopment.com/short-lived-feature-branches/

### Continuous Integration

- https://minimumcd.org/minimumcd/ci/

### Continuous Deployment/Release

- https://trunkbaseddevelopment.com/continuous-delivery/#continuous-deployment

## GitHub Flow

- https://githubflow.github.io/
- https://docs.github.com/en/get-started/using-github/github-flow

## Officially Unsupported Branching Models

### Trunk Based Development: Branch for release

https://trunkbaseddevelopment.com/branch-for-release/

exception:

- https://trunkbaseddevelopment.com/branch-for-release/#late-creation-of-release-branches
  - our maintenance release is an example of this approach

### git-flow

- https://nvie.com/posts/a-successful-git-branching-model/
- https://jeffkreeftmeijer.com/git-flow/

Even if this is strategy that you find useful for the applications you are building, which [the original author of the git-flow branching model recommends against](https://nvie.com/posts/a-successful-git-branching-model/),
we do not recommend this branching model when releasing artifacts with **semantic-release**.
While the [same reflection](https://nvie.com/posts/a-successful-git-branching-model/) that recommends against using git-flow for web apps suggests that it may still be a good fit for explicitly versioned software,
**semantic-release** is built with Continuous Deployment/Release in mind instead.

While some have found that the [Pre-release workflow](./workflow-configuration.md#pre-release-branches) enabled by **semantic-release** can be used to _simulate_ a git-flow-like workflow,
it is also worth noting that workflow is not intended for such a use case and requests for support when attempting to use it that way will be closed by our team.

### Workflows that Release for Testing Before Promotion to a Stable Release

- https://trunkbaseddevelopment.com/styles/#the-importance-of-a-local-build

### Monorepos

While not specifically a branching strategy,

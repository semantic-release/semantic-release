# Plugins list

## Default plugins

- [@semantic-release/github](https://github.com/semantic-release/github)
  - [verifyConditions](https://github.com/semantic-release/github#verifyconditions): Verify the presence and the validity of the GitHub authentication and release configuration
  - [publish](https://github.com/semantic-release/github#publish): Publish a [GitHub release](https://help.github.com/articles/about-releases)
  - [success](https://github.com/semantic-release/github#success): Add a comment to GitHub issues and pull requests resolved in the release
  - [fail](https://github.com/semantic-release/github#fail): Open a GitHub issue when a release fails
- [@semantic-release/npm](https://github.com/semantic-release/npm)
  - [verifyConditions](https://github.com/semantic-release/npm#verifyconditions): Verify the presence and the validity of the npm authentication and release configuration
  - [publish](https://github.com/semantic-release/npm#publish): Publish the package on the npm registry

## Official plugins

- [@semantic-release/gitlab](https://github.com/semantic-release/gitlab)
  - [verifyConditions](https://github.com/semantic-release/gitlab#verifyconditions): Verify the presence and the validity of the GitLab authentication and release configuration
  - [publish](https://github.com/semantic-release/gitlab#publish): Publish a [GitLab release](https://docs.gitlab.com/ce/workflow/releases.html)
- [@semantic-release/git](https://github.com/semantic-release/git)
  - [verifyConditions](https://github.com/semantic-release/git#verifyconditions): Verify the presence and the validity of the Git authentication and release configuration
  - [publish](https://github.com/semantic-release/git#publish): Push a release commit and tag, including configurable files
- [@semantic-release/changelog](https://github.com/semantic-release/changelog)
  - [verifyConditions](https://github.com/semantic-release/changelog#verifyconditions): Verify the presence and the validity of the configuration
  - [publish](https://github.com/semantic-release/changelog#publish): Create or update the changelog file in the local project repository
- [@semantic-release/exec](https://github.com/semantic-release/exec)
  - [verifyConditions](https://github.com/semantic-release/exec#verifyconditions): Execute a shell command to verify if the release should happen
  - [analyzeCommits](https://github.com/semantic-release/exec#analyzecommits): Execute a shell command to determine the type of release
  - [verifyRelease](https://github.com/semantic-release/exec#verifyrelease): Execute a shell command to verifying a release that was determined before and is about to be published.
  - [generateNotes](https://github.com/semantic-release/exec#analyzecommits): Execute a shell command to generate the release note
  - [publish](https://github.com/semantic-release/exec#publish): Execute a shell command to publish the release
  - [success](https://github.com/semantic-release/exec#success): Execute a shell command to notify of a new release
  - [fail](https://github.com/semantic-release/exec#fail): Execute a shell command to notify of a failed release

## Community plugins

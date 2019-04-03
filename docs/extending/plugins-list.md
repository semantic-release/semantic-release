# Plugins list

## Official plugins
- [@semantic-release/commit-analyzer](https://github.com/semantic-release/commit-analyzer)
  - `analyzeCommits`: Determine the type of release by analyzing commits with [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog)
- [@semantic-release/release-notes-generator](https://github.com/semantic-release/release-notes-generator)
  - `generateNotes`: Generate release notes for the commits added since the last release with [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog)
- [@semantic-release/github](https://github.com/semantic-release/github)
  - `verifyConditions`: Verify the presence and the validity of the GitHub authentication and release configuration
  - `publish`: Publish a [GitHub release](https://help.github.com/articles/about-releases)
  - `success`: Add a comment to GitHub issues and pull requests resolved in the release
  - `fail`: Open a GitHub issue when a release fails
- [@semantic-release/npm](https://github.com/semantic-release/npm)
  - `verifyConditions`: Verify the presence and the validity of the npm authentication and release configuration
  - `prepare`: Update the package.json version and create the npm package tarball
  - `publish`: Publish the package on the npm registry
- [@semantic-release/gitlab](https://github.com/semantic-release/gitlab)
  - `verifyConditions`: Verify the presence and the validity of the GitLab authentication and release configuration
  - `publish`: Publish a [GitLab release](https://docs.gitlab.com/ce/workflow/releases.html)
- [@semantic-release/git](https://github.com/semantic-release/git)
  - `verifyConditions`: Verify the presence and the validity of the Git authentication and release configuration
  - `prepare`: Push a release commit and tag, including configurable files
- [@semantic-release/changelog](https://github.com/semantic-release/changelog)
  - `verifyConditions`: Verify the presence and the validity of the configuration
  - `prepare`: Create or update the changelog file in the local project repository
- [@semantic-release/exec](https://github.com/semantic-release/exec)
  - `verifyConditions`: Execute a shell command to verify if the release should happen
  - `analyzeCommits`: Execute a shell command to determine the type of release
  - `verifyRelease`: Execute a shell command to verifying a release that was determined before and is about to be published.
  - `generateNotes`: Execute a shell command to generate the release note
  - `prepare`: Execute a shell command to prepare the release
  - `publish`: Execute a shell command to publish the release
  - `success`: Execute a shell command to notify of a new release
  - `fail`: Execute a shell command to notify of a failed release

## Community plugins

[Open a Pull Request](https://github.com/semantic-release/semantic-release/blob/caribou/CONTRIBUTING.md#submitting-a-pull-request) to add your plugin to the list.

- [semantic-release-docker](https://github.com/felixfbecker/semantic-release-docker)
  - `verifyConditions`: Verify that all needed configuration is present and login to the Docker registry.
  - `publish`: Tag the image specified by `name` with the new version, push it to Docker Hub and update the latest tag.
- [semantic-release-gcr](https://github.com/carlos-cubas/semantic-release-gcr)
  - `verifyConditions`: Verify that all needed configuration is present and login to the Docker registry.
  - `publish`: Tag the image specified by `name` with the new version, push it to Docker Hub and update the latest tag.
- [semantic-release-vsce](https://github.com/raix/semantic-release-vsce)
  - `verifyConditions`: Verify the presence and the validity of the vsce authentication and release configuration
  - `prepare`: Create a `.vsix` for distribution
  - `publish`: Publish the package to the Visual Studio Code marketplace
- [semantic-release-verify-deps](https://github.com/piercus/semantic-release-verify-deps)
  - `verifyConditions`: Check the dependencies format against a regexp before a release
- [semantic-release-chrome](https://github.com/GabrielDuarteM/semantic-release-chrome)
  - `verifyConditions`: Verify the presence of the authentication (set via environment variables)
  - `prepare`: Write the correct version to the manifest.json and creates a zip file of the whole dist folder
  - `publish`: Uploads the generated zip file to the webstore, and publish the item
- [semantic-release-firefox](https://github.com/felixfbecker/semantic-release-firefox)
  - `verifyConditions`: Verify the presence of the authentication (set via environment variables)
  - `prepare`: Write the correct version to the manifest.json,   creates a xpi file of the dist folder and a zip of the sources
  - `publish`: Submit the generated archives to the webstore for review, and publish the item including release notes
- [semantic-release-gerrit](https://github.com/pascalMN/semantic-release-gerrit)
  - `generateNotes`: Generate release notes with Gerrit reviews URL
- [semantic-release-expo](https://github.com/bycedric/semantic-release-expo)
  - `verifyConditions`: Verify Expo manifest(s) are readable and valid.
  - `prepare`: Update version, ios build number and android version code in the Expo manifest(s).

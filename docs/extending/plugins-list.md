# Plugins list

## Default plugins

- [@semantic-release/github](https://github.com/semantic-release/github)
  - [verifyConditions](https://github.com/semantic-release/github#verifyconditions): Verify the presence and the validity of the GitHub authentication and release configuration
  - [publish](https://github.com/semantic-release/github#publish): Publish a [GitHub release](https://help.github.com/articles/about-releases)
  - [success](https://github.com/semantic-release/github#success): Add a comment to GitHub issues and pull requests resolved in the release
  - [fail](https://github.com/semantic-release/github#fail): Open a GitHub issue when a release fails
- [@semantic-release/npm](https://github.com/semantic-release/npm)
  - [verifyConditions](https://github.com/semantic-release/npm#verifyconditions): Verify the presence and the validity of the npm authentication and release configuration
  - [prepare](https://github.com/semantic-release/npm#prepare): Update the package.json version and create the npm package tarball
  - [publish](https://github.com/semantic-release/npm#publish): Publish the package on the npm registry

## Official plugins

- [@semantic-release/gitlab](https://github.com/semantic-release/gitlab)
  - [verifyConditions](https://github.com/semantic-release/gitlab#verifyconditions): Verify the presence and the validity of the GitLab authentication and release configuration
  - [publish](https://github.com/semantic-release/gitlab#publish): Publish a [GitLab release](https://docs.gitlab.com/ce/workflow/releases.html)
- [@semantic-release/git](https://github.com/semantic-release/git)
  - [verifyConditions](https://github.com/semantic-release/git#verifyconditions): Verify the presence and the validity of the Git authentication and release configuration
  - [prepare](https://github.com/semantic-release/git#prepare): Push a release commit and tag, including configurable files
- [@semantic-release/changelog](https://github.com/semantic-release/changelog)
  - [verifyConditions](https://github.com/semantic-release/changelog#verifyconditions): Verify the presence and the validity of the configuration
  - [prepare](https://github.com/semantic-release/changelog#prepare): Create or update the changelog file in the local project repository
- [@semantic-release/exec](https://github.com/semantic-release/exec)
  - [verifyConditions](https://github.com/semantic-release/exec#verifyconditions): Execute a shell command to verify if the release should happen
  - [analyzeCommits](https://github.com/semantic-release/exec#analyzecommits): Execute a shell command to determine the type of release
  - [verifyRelease](https://github.com/semantic-release/exec#verifyrelease): Execute a shell command to verifying a release that was determined before and is about to be published.
  - [generateNotes](https://github.com/semantic-release/exec#analyzecommits): Execute a shell command to generate the release note
  - [prepare](https://github.com/semantic-release/exec#prepare): Execute a shell command to prepare the release
  - [publish](https://github.com/semantic-release/exec#publish): Execute a shell command to publish the release
  - [success](https://github.com/semantic-release/exec#success): Execute a shell command to notify of a new release
  - [fail](https://github.com/semantic-release/exec#fail): Execute a shell command to notify of a failed release

## Community plugins

[Open a Pull Request](https://github.com/semantic-release/semantic-release/blob/caribou/CONTRIBUTING.md#submitting-a-pull-request) to add your plugin to the list.

- [semantic-release-docker](https://github.com/felixfbecker/semantic-release-docker) Set of semantic-release plugins for publishing a docker image to Docker Hub
  - [verifyConditions](https://github.com/felixfbecker/semantic-release-docker#verifyconditions) Verify that all needed configuration is present and login to the Docker registry.
  - [publish](https://github.com/felixfbecker/semantic-release-docker#publish) Tag the image specified by `name` with the new version, push it to Docker Hub and update the latest tag.
- [semantic-release-gcr](https://github.com/carlos-cubas/semantic-release-gcr) Set of semantic-release plugins for publishing a docker image to Google Container Registry
  - [verifyConditions](https://github.com/carlos-cubas/semantic-release-gcr#verifyconditions) Verify that all needed configuration is present and login to the Docker registry.
  - [publish](https://github.com/carlos-cubas/semantic-release-gcr#publish) Tag the image specified by `name` with the new version, push it to Docker Hub and update the latest tag.
- [semantic-release-vsce](https://github.com/raix/semantic-release-vsce) Set of semantic-release plugins for publishing Visual Studio Code extensions to the marketplace
  - **verifyConditions** Verify the presence and the validity of the vsce authentication and release configuration
  - **prepare** Create a `.vsix` for distribution
  - **publish** Publish the package to the Visual Studio Code marketplace
- [semantic-release-verify-deps](https://github.com/piercus/semantic-release-verify-deps) 
  - [verifyConditions](https://github.com/piercus/semantic-release-verify-deps) Check the dependencies format against a regexp before a release
- [semantic-release-chrome](https://github.com/GabrielDuarteM/semantic-release-chrome) Set of semantic-release plugins for publishing a Chrome extension release.
  - [verifyConditions](https://github.com/GabrielDuarteM/semantic-release-chrome#verifyconditions) Verify the presence of the authentication (set via environment variables).
  - [prepare](https://github.com/GabrielDuarteM/semantic-release-chrome#prepare) Write the correct version to the manifest.json and creates a zip file of the whole dist folder.
  - [publish](https://github.com/GabrielDuarteM/semantic-release-chrome#publish) Uploads the generated zip file to the webstore, and publish the item.

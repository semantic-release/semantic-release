# Using semantic-release-plus with an nx monorep

This configuration will allow you to release multiple packages from a single [nx](https://nx.dev) monorepo. It supports independent versions and change logs per releasable unit of code.

## Base Release Config

Create a release.config.js at the root of your nx project. This file can be used to establish common settings accross your entire repo similar to tsconfig and jest base configs

```JavaScript
module.exports = {
  preset: 'conventionalcommits',
  presetConfig: {
    types: [
      { type: 'feat', section: 'Features' },
      { type: 'fix', section: 'Bug Fixes' },
      { type: 'chore', section: 'Chores' },
      { type: 'docs', hidden: true },
      { type: 'style', hidden: true },
      { type: 'refactor', section: 'Refactoring' },
      { type: 'perf', hidden: true },
      { type: 'test', hidden: true },
    ],
  },
  releaseRules: [{ type: 'refactor', release: 'patch' }],
};
```

## App/Lib/Package Release Config

Each new releasable app will also have a release config and this will allow you to tailor each app/lib to release to a different location using different plugins if required.

commitPaths - the commit paths property was added to provide a way to filter commits by directory. depending on your approach you may want to include angular.json, package.json, and nx.json in the list of commit paths.

```JavaScript
const appName = 'admin-webui';
const appPath = `apps/${appName}`;
const artifactName = appName;
module.exports = {
  name: appName,
  pkgRoot: `dist/${appPath}`, // should come from angular.cli
  tagFormat: artifactName + '-v${version}',
  commitPaths: ['force-release.md', `${appPath}/*`], // should come from dep-graph and angular.json
  assets: [`${appPath}/README.md`, `${appPath}/CHANGELOG.md`],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: `${appPath}/CHANGELOG.md`,
      },
    ],
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        message:
          `chore(release): ${artifactName}` +
          '-v${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};
```

## angular/workspace.json

Add a section to each releasable project in the angular/workspace.json calling semantic-release and telling it to use the specific release.config.js for your project. This section should be at the same level as the test/lint/build commands.

```text
  "release": {
    "builder": "@nrwl/workspace:run-commands",
    "options": {
      "commands": [
        {
          "command": "npx semantic-release --debug --extends=./apps/admin-webui/release.config.js"
        }
      ]
    }
  }
```

## nx.json

Depending on your approach you may want to add the release.config.js the nx.json implicitDependencies, this would force all projects to be affected if this file changes.

## CI/CD Considerations

Some plugins (git) will add a commit to your repo which means you cannot run the release task distribured and/or in parallel on your ci/cd system because your local workspace will get ahead / behind the remote.

## Todo

- Create an nx plugin that automates the steps above
- for the project specific release config programmatically get the current project name, source dir, and dependencies for commitPaths.
- Add a configPath cli argument rather than extends to specify the path to the semantic-release config

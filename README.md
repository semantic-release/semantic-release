# :package::rocket: semantic-release

**fully automated package publishing**

> **Trust us, this will change your workflow for the better.**

> – [egghead.io](https://egghead.io/lessons/javascript-how-to-write-a-javascript-library-automating-releases-with-semantic-release)

[![Join the chat at https://gitter.im/semantic-release/semantic-release](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/semantic-release/semantic-release?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![npm](https://img.shields.io/npm/v/semantic-release.svg)](https://www.npmjs.com/package/semantic-release)
[![Greenkeeper badge](https://badges.greenkeeper.io/semantic-release/semantic-release.svg)](https://greenkeeper.io/)
[![license](https://img.shields.io/github/license/semantic-release/semantic-release.svg)](https://github.com/semantic-release/semantic-release/blob/master/LICENSE)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

[![Travis](https://img.shields.io/travis/semantic-release/semantic-release/caribou.svg)](https://travis-ci.org/semantic-release/semantic-release)
[![Codecov](https://img.shields.io/codecov/c/github/semantic-release/semantic-release/caribou.svg)](https://codecov.io/gh/semantic-release/semantic-release)

Out of the box this is just about _commit-messages_, but you can do so much more.

* **Detect breaking changes** using the test suite of your last release: [cracks](https://github.com/semantic-release/cracks)
* Detect breaking changes using your dependents’ test suites: [Help out! Implement the **dont-break** plugin](https://github.com/semantic-release/semantic-release/issues/65)
* Detect breaking changes diffing your JSDoc interface: [Help out! Implement the **india** plugin](https://github.com/semantic-release/semantic-release/issues/66)
* Abort releases with **insufficient test coverage**: [Help out! Implement the **istanbul** plugin](https://github.com/semantic-release/semantic-release/issues/68)
* Abort releases with **vulnerable dependencies** in the tree: [Help out! Implement the **nsp** plugin](https://github.com/semantic-release/semantic-release/issues/67)
* Everything you can imagine: [Build Plugins!](https://github.com/semantic-release/semantic-release#plugins)

&nbsp; | Commands | Comment
--- | --- | ---
| **manual/before** | <pre><code><div>npm version major</div><div>git push origin master --tags</div><div>npm publish</div></code></pre> | You **manually decide** what the **next version** is. You have to remember what major, minor and patch means. You have to remember to push both commits and tags. You have to wait for the CI to pass. |
| **semantic-release/after** | <pre><code><div>git commit -m "fix: &lt;message&gt;"</div><div>git push</div></code></pre> | You **describe the changes** you’ve made. A new version is automatically published with the correct version number.

This removes the immediate connection between human emotions and version numbers, so strictly following the [SemVer](http://semver.org/) spec is not a problem anymore – and that’s ultimately `semantic-release`’s goal.

<table>
  <tr>
    <th colspan="2">
      “How to Write a JavaScript Library - Automating Releases with semantic-release” – egghead.io
    </th>
  </tr>
  <tr>
    <td colspan="2">
      <a href="https://egghead.io/lessons/javascript-how-to-write-a-javascript-library-automating-releases-with-semantic-release"><img src="https://cloud.githubusercontent.com/assets/908178/9730739/7b1da5d8-5610-11e5-88b6-5c75fdda7ee2.png" alt="egghead.io session"></a>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      A free egghead.io tutorial series on how to write an open source library featuring semantic-release.
    </td>
  </tr>
  <tr>
    <th>
      “We fail to follow SemVer – and why it needn’t matter”
    </th>
    <th>
      “semantic-release Q&A with Kent C. Dodds”
    </th>
  </tr>
  <tr>
    <td>
      <a href="https://www.youtube.com/watch?v=tc2UgG5L7WM&amp;index=6&amp;list=PLFZ5NyC0xHDaaTy6tY9p0C0jd_rRRl5Zm"><img alt="JSConfBP Talk" src="https://cloud.githubusercontent.com/assets/908178/9428178/c337ed26-49a2-11e5-8ad0-a602500a65bf.png"></a>
    </td>
    <td>
      <a href="https://www.youtube.com/watch?v=g6y3DnhkjrI"><img alt="Hangout on Air with Kent C. Dodds" src="https://cloud.githubusercontent.com/assets/908178/9428179/c3387318-49a2-11e5-9f5f-dccd3fbb0c1d.png"></a>
    </td>
  </tr>
  <tr>
    <td>
      This talk gives you a complete introduction to the underlying concepts of this module. 38:30
    </td>
    <td>
      A “Hangouts on Air” conversation with hands on questions and answers about how to use semantic-release. 53:52
    </td>
  </tr>
</table>

## How does it work?

Instead of writing [meaningless commit messages](http://whatthecommit.com/), we can take our time to think about the changes in the codebase and write them down. Following formalized conventions it is then possible to generate a helpful changelog and to derive the next semantic version number from them.

When `semantic-release` is set up it will do that after every successful continuous integration build of your master branch (or any other branch you specify) and publish the new version for you. This way no human is directly involved in the release process and your releases are guaranteed to be [unromantic and unsentimental](http://sentimentalversioning.org/).

If you fear the loss of control over timing and marketing implications of software releases you should know that `semantic-release` supports [release channels](https://github.com/npm/npm/issues/2718) using `npm`’s [dist-tags](https://docs.npmjs.com/cli/dist-tag). This way you can keep control over what your users end up using by default, you can decide when to promote an automatically released version to the stable channel, and you can choose which versions to write blogposts and tweets about. You can use the same mechanism to [support older versions of your software](https://gist.github.com/boennemann/54042374e49c7ade8910), for example with important security fixes.

This is what happens in series:

| 1. `git push` | 2. `semantic-release pre` | 3. `npm publish` | 4. `semantic-release post` |
| :--- | :--- | :--- | :---- |
| New code is pushed and triggers a CI build. | Based on all commits that happened since the last release, the new version number gets written to the `package.json`. | The new version gets published to `npm`. | A changelog gets generated and a [release](https://help.github.com/articles/about-releases/) (including a git tag) on GitHub gets created. |

_Note:_ The current release/tag implementation is tied to GitHub, but could be opened up to Bitbucket, GitLab, et al. Feel free to send PRs for these services.

## Default Commit Message Format

This module ships with the [AngularJS Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit) and changelog generator, but you can [define your own](#plugins) style.

Each commit message consists of a **header**, a **body** and a **footer**.  The header has a special
format that includes a **type**, a **scope** and a **subject** ([full explanation](https://github.com/stevemao/conventional-changelog-angular/blob/master/convention.md)):

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

You can simplify using this convention for yourself and contributors by using [commitizen](https://github.com/commitizen/cz-cli) and [commitlint](https://github.com/marionebl/commitlint) or [semantic-git-commit-cli](https://github.com/JPeer264/node-semantic-git-commit-cli).

### Patch Release

```
fix(pencil): stop graphite breaking when too much pressure applied
```

### ~~Minor~~ Feature Release

```
feat(pencil): add 'graphiteWidth' option
```

### ~~Major~~ Breaking Release

```
perf(pencil): remove graphiteWidth option

BREAKING CHANGE: The graphiteWidth option has been removed. The default graphite width of 10mm is always used for performance reasons.
```

## Setup

[![NPM](https://nodei.co/npm/semantic-release.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/semantic-release/)

```bash
npm install -g semantic-release-cli

cd your-module
semantic-release-cli setup
```

![dialogue](https://cloud.githubusercontent.com/assets/908178/9428123/3628dfec-499f-11e5-8bdd-8f3042dd95ed.png)

_[This is what happens under the hood.](https://github.com/semantic-release/cli#what-it-does)_

## Options

You can pass options either via command line (in [kebab-case](https://lodash.com/docs#kebabCase)) or in the `release` field of your `package.json` (in [camelCase](https://lodash.com/docs#camelCase)). The following two examples are the same, but CLI arguments take precedence.

| CLI | package.json |
| --- | --- |
| <pre><code>semantic-release pre --no-debug</code><pre> | <pre><code><div>//package.json</div><div>"release": {</div><div>  "debug": false</div><div>}</div></code></pre><pre><code>semantic-release pre</code></pre> |


These options are currently available:
- `branch`: The branch on which releases should happen. Default: `'master'`
- `debug`: If true doesn’t actually publish to npm or write things to file. Default: `!process.env.CI`
- `githubToken`: The token used to authenticate with GitHub. Default: `process.env.GH_TOKEN`
- `githubUrl`: Optional. Pass your GitHub Enterprise endpoint.
- `githubApiPathPrefix`: Optional. The path prefix for your GitHub Enterprise API.

_A few notes on `npm` config_:
1. The `npm` token can only be defined in the environment as `NPM_TOKEN`, because that’s where `npm` itself is going to read it from.

2. In order to publish to a different `npm` registry you can specify that inside the `package.json`’s [`publishConfig`](https://docs.npmjs.com/files/package.json#publishconfig) field.

3. If you want to use another dist-tag for your publishes than `'latest'` you can specify that inside the `package.json`’s [`publishConfig`](https://docs.npmjs.com/files/package.json#publishconfig) field.

4. `semantic-release` generally tries to orientate itself towards `npm` – it inherits the loglevel for example.

## Plugins

There are numerous steps where you can customize `semantic-release`’s behaviour using plugins. A plugin is a regular [option](#options), but passed inside the `release` block of `package.json`:

```json
{
  "release": {
    "analyzeCommits": "npm-module-name",
    "generateNotes": "./path/to/a/local/module",
    "verifyConditions": {
      "path": "./path/to/a/module",
      "additional": "config"
    }
}
```

```
semantic-release pre --analyze-commits="npm-module-name"
```

A plugin itself is an async function that always receives three arguments.

```js
module.exports = function (pluginConfig, config, callback) {}
```

- `pluginConfig`: If the user of your plugin specifies additional plugin config in the `package.json` (see the `verifyConditions` example above) then it’s this object.
- `config`: A config object containing a lot of information to act upon.
  - `env`: All environment variables
  - `npm`: Select npm configuration bits like `registry`, `tag` and `auth`
  - `options`: `semantic-release` options like `debug`, or `branch`
  - `pkg`: Parsed `package.json`
  - For certain plugins the `config` object contains even more information. See below.
- `callback`: If an error occurs pass it as first argument. Otherwise pass your result as second argument.


### `analyzeCommits`

This plugin is responsible for determining the type of the next release. It additionally receives a `commits` array inside `config`. One commit is an object with a `message` and `hash` property. Call the callback with `'major'`, `'premajor'`, `'minor'`, `'preminor'`, `'patch'`, `'prepatch'`, `'prerelease'`, or `null` if nothing changed.

While it may be tempting to use `'prepatch'`, `'preminor'` & `'prerelease'` as part of a release process, this is strongly discouraged. A better approach is to use [dist-tags](https://docs.npmjs.com/cli/dist-tag) to create release channels (such as 'latest', 'next', 'stable') and to return only `'major'`, `'premajor'` and `'minor'` from the commit analyzer.

Have a look at the [default implementation](https://github.com/semantic-release/commit-analyzer/).

### `generateNotes`

This plugin is responsible for generating release notes. Call the callback with the notes as a string. Have a look at the [default implementation](https://github.com/semantic-release/release-notes-generator/).

### `verifyConditions`

This plugins is responsible for verifying that a release should happen in the first place. For example, the [default implementation](https://github.com/semantic-release/condition-travis/) verifies that the publish is happening on Travis, that it’s the right branch, and that all other build jobs succeeded. There are more use cases for this, e.g. verifying that test coverage is above a certain threshold or that there are no [vulnerabilities](https://nodesecurity.io/) in your dependencies. Be creative.

Passing an array of plugins will run them in series.

### `verifyRelease`

This plugin is responsible for verifying a release that was determined before and is about to be published. There is no default implementation. It additionally receives `nextRelease`, `lastRelease` and `commits` inside `config`. While `commits` is the same as with analyzeCommits, `nextRelease` contains a `type` (e.g. `'major'`) and the new version (e.g. `'1.0.0'`) and `lastRelease` contains the old `version`, the `gitHead` at the time of the release and the npm dist-`tag` (e.g. `'latest'`). Using this information you could [detect breaking changes](https://github.com/semantic-release/cracks) or hold back certain types of releases. Again: Be creative.

Passing an array of plugins will run them in series.

### `getLastRelease`

This plugin is responsible for determining a package’s last release version. The [default implementation](https://github.com/semantic-release/last-release-npm) uses the last published version on a npm registry.

## ITYM*FAQ*LT
> I think you might frequently ask questions like these

### Why is the `package.json`’s version not updated in my repository?

The `npm` docs even state:

> The most important things in your package.json are the name and version fields. Those are actually required, and your package won’t install without them.
> – [npm docs](https://docs.npmjs.com/files/package.json#version)

While this entirely true the version number doesn’t have to be checked into source control. `semantic-release` takes care of the version field right before `npm publish` uses it – and this is the only point where it _really_ is required.

### Is there a way to preview which version would currently get published?

If you run `npm run semantic-release` locally a dry run gets performed, which logs the version that would currently get published.

### Can I run this on my own machine rather than on a CI server?

Of course you can, but this doesn’t necessarily mean you should. Running your tests on an independent machine before releasing software is a crucial part of this workflow. Also it is a pain to set this up locally, with tokens lying around and everything. That said, you can run the scripts with `--debug=false` explicitly. You have to export `GH_TOKEN=<your_token>` and `NPM_TOKEN=<your_other_token>`.

### Can I manually trigger the release of a specific version?

You can trigger a release by pushing to your GitHub repository. You deliberately cannot trigger a _specific_ version release, because this is the whole point of `semantic-release`. Start your packages with `1.0.0` and semver on.  

### Is it _really_ a good idea to release on every push?

It is indeed a great idea because it _forces_ you to follow best practices. If you don’t feel comfortable making every passing feature or fix on your master branch addressable via `npm` you might not treat your master right. Have a look at [branch workflows](https://guides.github.com/introduction/flow/index.html). If you still think you should have control over the exact point in time of your release, e.g. because you are following a release schedule, you can release only on the `production`/`deploy`/`release` branch and push your code there in certain intervals, or better yet use [dist-tags](https://docs.npmjs.com/cli/dist-tag).

### Why should I trust `semantic-release` with my releases?

`semantic-release` has a full unit- and integration-test-suite that tests _actual_ `npm` publishes against the [npm-registry-couchapp](https://github.com/npm/npm-registry-couchapp/). A new version won’t get published if it doesn’t pass on all these engines.

### Why does `semantic-release` require node version >= 8

Being able to write code for just the most recent node versions greatly simplifies development. More language features are available, no transpilation is required, less test builds are to be run, awaited and debugged.

For a special purpose tool like `semantic-release`, that's only meant to be used in controlled CI environments, we think it's okay to have such a high version requirement. As `semantic-release` handles package publishing we expect almost every project to have at least one build job running node 8 already – and that's all it takes. Even if that's not that case `semantic-release` can still be executed with the help of [npx](https://www.npmjs.com/package/npx) (`npx -p node@8 npm run semantic-release`).

## Badge

Use this in one of your projects? Include one of these badges in your README.md to let people know that your package is published using `semantic-release`.

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

```md
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
```

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=plastic)](https://github.com/semantic-release/semantic-release)

```md
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=plastic)](https://github.com/semantic-release/semantic-release)
```

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

```md
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
```

## License

MIT License
2015 © Stephan Bönnemann and [contributors](https://github.com/semantic-release/semantic-release/graphs/contributors)

[![](https://cloud.githubusercontent.com/assets/908178/6091690/cc86f58c-aeb8-11e4-94cb-15f15f486cde.png)](https://twitter.com/trodrigues/status/509301317467373571)

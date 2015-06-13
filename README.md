# semantic-release
[![Build Status](https://travis-ci.org/boennemann/semantic-release.svg?branch=master)](https://travis-ci.org/boennemann/semantic-release)
[![Coverage Status](https://coveralls.io/repos/boennemann/semantic-release/badge.svg)](https://coveralls.io/r/boennemann/semantic-release)
[![Dependency Status](https://david-dm.org/boennemann/semantic-release.svg)](https://david-dm.org/boennemann/semantic-release)
[![devDependency Status](https://david-dm.org/boennemann/semantic-release/dev-status.svg)](https://david-dm.org/boennemann/semantic-release#info=devDependencies)

[![NPM](https://nodei.co/npm/semantic-release.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/semantic-release/)

## What is `semantic-release` about?

At its core `semantic-release` is a set of conventions that gives you entirely automated, semver-compliant package publishing. Luckily these conventions make sense on their own, like having meaningful commit messages.

[![JSConfBP Talk](https://cloud.githubusercontent.com/assets/908178/8032541/e9bf6300-0dd6-11e5-92c9-8a39211368af.png)](https://www.youtube.com/watch?v=tc2UgG5L7WM&index=6&list=PLFZ5NyC0xHDaaTy6tY9p0C0jd_rRRl5Zm)

> This talk gives you a complete introduction to the underlying concepts plus a live demo at the end.

It is fully integrated into the `npm` lifecycle, so all you need to do is to configure your CI to regularly `npm publish` (i.e. for every commit).

It removes human decisions and emotions from version numbers and releases – suddenly, strictly following the [SemVer](http://semver.org/) spec isn't a problem anymore.

## How does it work?

Instead of dumping [lols](http://whatthecommit.com/) into our commit messages, we can take some time to think about what we changed in the codebase and write it down. Following formalized conventions it this then possible to not only generate a helpful changelog, but to determine whether a new version should be released.

This module ships with the [AngularJS Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit), but you can [define your own](https://github.com/boennemann/semantic-release/wiki/commit-analysis).

### The `prepublish` step

Before `npm` actually gets to publish a new version `semantic-release`'s `prepublish` step does the following:

- Extract all commits since the last version was published
- Determine the release type (`major`|`minor`|`patch`) or abort if nothing relevant changed
- Increase the version number accordingly

### The `publish` step

`npm` does its thing.

### The `postpublish` step

After `npm` published the new version the `postpublish` step does this:

- Generate release notes
- Create a new [GitHub Release](https://help.github.com/articles/about-releases/) (including a git tag) with the release notes

Note: The default release notes are a [changelog](https://github.com/ajoslin/conventional-changelog) that is generated from git metadata, using the AngularJS commit conventions. You can [specify your own release note generator](https://github.com/boennemann/semantic-release/wiki/release-note-generation).

Note: This is tied to GitHub, feel free to send PRs for other services.

Note: `semantic-release` works around a limitation in `npm`'s `prepublish` step. Once a version is published it prints a "Could not pack" error that you can *safely ignore* [npm/npm#7118](https://github.com/npm/npm/issues/7118).

## How you can set it up

### Installation

First of all you need to install `semantic-release` and save it as a `devDependency`.

```bash
npm install --save-dev semantic-release
# Btw, if you're feeling lazy you can just type this – it's the same thing.
npm i -D semantic-release
```

### Package

```bash
./node_modules/.bin/semantic-release setup
```

What this does:

#### Scripts

The setup command configures `scripts` inside the `package.json`:

```json
"scripts": {
  "prepublish": "semantic-release pre",
  "postpublish": "semantic-release post"
}
```

Note: If you have already configured `scripts` for `prepublish` or `postpublish` they're just executed one after another. For example: `"npm run babelify && semantic-release pre"`.

#### Version

It would be preferable not to have a version field in the `package.json` at all, but due to an `npm` limitation it is required to have a _not yet published_ version in there [npm/npm#7118](https://github.com/npm/npm/issues/7118). Because of this the version gets changed to `"0.0.0-semantically-released"` until `npm` _hopefully_ removes its limitations.

#### Repository

If you haven't defined your GitHub repository in the `package.json`s [repository field](https://docs.npmjs.com/files/package.json#repository) the remote `origin`'s repository is used.

### CI Server

Inside your `.travis.yml`:

```yml
language: node_js
node_js:
- iojs-v1
# If you have a more sophisticated build with multiple jobs you should have a look at
# https://github.com/dmakhno/travis_after_all which is also configured for this
# package. (Check the .travis.yml)
sudo: false
cache:
  directories:
  - node_modules
notifications:
  email: false
# See https://github.com/boennemann/semantic-release/issues/18
before_deploy:
- npm config set spin false --global
env:
  # Get your token here: https://github.com/settings/tokens/new
  # Grant the token repo/public_repo scope (all others can be deselected)
  # You should encrypt this:
  # `travis encrypt GH_TOKEN=<token> --add`
  global: GH_TOKEN=<github-access-token-with-access-to-your-repo>
deploy:
  provider: npm
  email: <your-npm-mail@example.com>
  # Very important. Don't forget this one.
  skip_cleanup: true
  # Travis currently only supports the old auth key format.
  # Do `echo -n "<username>:<password>" | base64` to get it.
  # You should encrypt this:
  # `travis encrypt $(echo -n "<username>:<password>" | base64) --add deploy.api_key`
  api_key: <npm-api-key>
  on:
    branch: master
    repo: <user>/<repo>
```

Note: This isn't tied to a specific service, but example configuration is provided for [Travis CI](https://travis-ci.org/). Feel free to contribute configuration for other servers or services.

Note: You should [encrypt](http://docs.travis-ci.com/user/environment-variables/#sts=Secure Variables) your api keys and tokens. If this is a new repository, don't forget to [enable it on Travis](https://travis-ci.org/profile) to make encrypt work.

Note: Your CI environment has to export `CI=true` in order for `semantic-release` not to automatically perform a dry run. Travis CI does this by default.

Note: It is crucial that your CI server also fetches all tags when checking out your repository. Travis CI does this by default.

## ITYM*FAQ*LT
> I think you might frequently ask questions like these

### Why is the `package.json`'s version not updated in my repository?

The `npm` docs even state:

> The most important things in your package.json are the name and version fields. Those are actually required, and your package won't install without them.
> -- [npm docs](https://docs.npmjs.com/files/package.json#version)

While this entirely true the version number doesn't have to be checked into source control. `semantic-release` takes care of the version field right before `npm publish` uses it – and this is the only point where it _really_ is required.

### Is there a way to preview which version would currently get published?

If you're running `npm publish` locally `semantic-release` automatically performs a dry run. This does log the version that would currently get published, but only if you `git fetch --tags` before.

### Can I run this on my own machine rather than on a CI server?

Of course you can, but this doesn't necessarly mean you should. Running your tests on an independent machine before releasing software is a crucial part of this workflow. Also it is a pain to set this up locally, with GitHub tokens lying around and everything. That said, you can either set the environment variable `CI=true`, or run the scripts with `--debug=false` explicitly. Don't forget to export `GH_TOKEN=your_token` as well.

### Can I manually trigger the release of a specific version?

You can trigger a release by pushing to your repository. You deliberately can not trigger a _specific_ version release, because this is the whole point of `semantic-release`. Start your packages with `1.0.0` and semver on.  

Note: The default commit message conventions do not support pre-release flags, but you can build this in yourself using [custom analyzers](https://github.com/boennemann/semantic-release/wiki/commit-analysis).

### How do I get back to good ol' `npm publish`?

`npm` offers the `--ignore-scripts` flag. Doing `npm publish --ignore-scripts` doesn't execute the `prepublish` and `postpublish` scripts.

### Is it _really_ a good idea to release on every push?

It is indeed a great idea because it _forces_ you to follow best practices. If you don't feel comfortable making every passing feature or fix on your master branch addressable via `npm` you might not treat your master right. Have a look at [branch workflows](https://guides.github.com/introduction/flow/index.html). If you still think you should have control over the exact point in time of your release, e.g. because you are following a release schedule, configure your CI server to release only on the `production`/`deploy`/`release` branch and push your code there in certain intervals.

### Why should I trust `semantic-release` with my releases? What if it breaks?

`semantic-release` has a full integration-test suite that tests _actual_ `npm` publishes and _actual_ GitHub Releases (with private registry/API) on node.js `^0.10`, `^0.12` and io.js `^1`, `^2`. A new version won't get published if it doesn't pass on all these engines.

## License

MIT License
2015 © Stephan Bönnemann and [contributors](https://github.com/boennemann/semantic-release/graphs/contributors)

![https://twitter.com/trodrigues/status/509301317467373571](https://cloud.githubusercontent.com/assets/908178/6091690/cc86f58c-aeb8-11e4-94cb-15f15f486cde.png)

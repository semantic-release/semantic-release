# semantic-release
[![Build Status](https://travis-ci.org/boennemann/semantic-release.svg)](https://travis-ci.org/boennemann/semantic-release)
[![Dependency Status](https://david-dm.org/boennemann/semantic-release.svg)](https://david-dm.org/boennemann/semantic-release)
[![devDependency Status](https://david-dm.org/boennemann/semantic-release/dev-status.svg)](https://david-dm.org/boennemann/semantic-release#info=devDependencies)

[![NPM](https://nodei.co/npm/semantic-release.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/semantic-release/)

## What is this thing even?

`semantic-release` is a toolset to fully automate your package's releases. This will determine not only which version to release, but also when – all without you having to care about it ever again.

This is fully integrated with the `npm` livecycle, so all you have to do is to setup your CI to `npm publish`.

The goal of this package is to remove humans from version numbers and releases. The [SemVer](http://semver.org/) spec clearly and unambiguously defines when to increase the major, minor or patch part and still we tend to think we're clever when we ignore this, because marketing or something.

![https://twitter.com/trodrigues/status/509301317467373571](https://cloud.githubusercontent.com/assets/908178/6091690/cc86f58c-aeb8-11e4-94cb-15f15f486cde.png)

## How does this work?

Conventions, conventions, conventions. Instead of dumping funny lols into our commit messages, we can take some time to think about what we changed in the codebase and write it down. Following formalized conventions it this then possible to not only generate a meaningful changelog, but to determine the next semantic version to release. Currently the only supported style is the [AngularJS Commit Message Convention](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit) style, but feel free to formalize your own style, write a parser for it, and send a PR to this package. 

The preferred configuration is the "try to release every push mode". What it does is that everytime a build passes `npm publish` is executed. 

### The `prepublish` step

Before `npm` actually gets to publish a new version `semantic-release`'s `prepublish` step does the following:

- Analyze the commits since the last version was published
- Decide on the release type (`major`|`minor`|`patch`) or abort if nothing changed
- Get the last version published from the registry
- Increase the last version with the determined type
- Write the new version to the package

### The `publish` step

`npm` does its thing.

### The `postpublish` step

After `npm` published the new version the `postpublish` step does this:

- Generate a changelog
- Create a new [GitHub Release](https://help.github.com/articles/about-releases/) with the changelog as body

Note: The GitHub Release automatically creates a tag, too.
Note: This is tied to GitHub, feel free to send PRs for other services.
Note: `semantic-release` works around a limitation in `npm`'s `prepublish` step. Once a version is published it prints an error that you can *safely ignore* [npm/npm#7118](https://github.com/npm/npm/issues/7118).

## How do I set this up?

First of all you need to install `semantic-release` and save it as a `devDependency`.

```bash
npm i -D semantic-release
```

Now you need to set up your `scripts` inside the `package.json`:

```json
"scripts": {
  "prepublish": "semantic-release pre",
  "postpublish": "semantic-release post"
}
```

Note: If you have already configured `scripts` for `prepublish` or `postpublish` you can just execute them one after another. For example: `"semantic-release pre && npm run 6to5"`.

Now the `npm` part is done and you need to set up your CI server.

Inside your `.travis.yml`:
```yml 
language: node_js
node_js:
- iojs-v1
sudo: false
cache:
  directories:
  - node_modules
notifications:
  email: false
env:
  global: GH_TOKEN=<github-access-token-with-acceess-to-your-repo>
deploy:
  provider: npm
  email: <your-npm-mail@example.com>
  # Very important. Don't forget this one.
  skip_cleanup: true
  # Travis currently only supports the old auth key format.
  # Do `echo -n "username:passowrd" | base64` to get it.
  api_key: <npm-api-key>
  on:
    branch: master
    repo: <user>/<repo>
```
Note: For once this isn't tied to a specific service, but example configuration is shown for [Travis CI](https://travis-ci.org/). Feel free to contribute configuration of other servers or services.
Note: You should [encrypt](http://docs.travis-ci.com/user/environment-variables/#sts=Secure Variables) your api keys and tokens.
Note: If you have a more sophisticated build with multiple jobs you should have a look at [travis-after-all](https://github.com/dmakhno/travis_after_all), which is also configured for this [package](.travis.yml).

MIT License
Stephan Bönnemann

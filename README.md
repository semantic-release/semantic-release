# semantic-release
[![Build Status](https://travis-ci.org/boennemann/semantic-release.svg)](https://travis-ci.org/boennemann/semantic-release)
[![Dependency Status](https://david-dm.org/boennemann/semantic-release.svg)](https://david-dm.org/boennemann/semantic-release)
[![devDependency Status](https://david-dm.org/boennemann/semantic-release/dev-status.svg)](https://david-dm.org/boennemann/semantic-release#info=devDependencies)

[![NPM](https://nodei.co/npm/semantic-release.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/semantic-release/)

```bash
npm i semantic-release
```

`semantic-release` provides "prepublish" and "postpublish" hooks so you automatically release the correct version.

Run `semantic-release pre` right before `npm publish` and `semantic-release post` right after. 

For maximum comfort you can automate this inside your `package.json`:

```json
"scripts": {
  "prepublish": "semantic-release pre",
  "postpublish": "semantic-release post"
}
```

Note: Even though `semantic-release` works around a limitation in npm's "prepublish" hook using it prints an error that you can *safely ignore*.
See [npm/npm#7118](https://github.com/npm/npm/issues/7118).

MIT License
2015 Stephan Bönnemann

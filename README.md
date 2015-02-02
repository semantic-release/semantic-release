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

The post hook is automatable in `package.json` with a "postpublish" script:
```json
"scripts": {
  "postpublish": "semantic-release post"
}
```

This is currently not possible for the "prepublish" hook. See [npm/npm#7118](https://github.com/npm/npm/issues/7118).

MIT License
2015 Stephan Bönnemann

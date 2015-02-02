# semantic-release
[![Build Status](https://travis-ci.org/boennemann/semantic-release.svg)](https://travis-ci.org/boennemann/semantic-release)
[![Dependency Status](https://david-dm.org/boennemann/semantic-release.svg)](https://david-dm.org/boennemann/semantic-release)
[![devDependency Status](https://david-dm.org/boennemann/semantic-release/dev-status.svg)](https://david-dm.org/boennemann/semantic-release#info=devDependencies)

[![NPM](https://nodei.co/npm/semantic-release.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/semantic-release/)

```bash
npm i semantic-release
```

`semantic-release` provides "prepublish" and "postpublish" hooks so you automatically release the correct version.

Add this to your `package.json` for maximum comfort:
```json
"scripts": {
  "prepublish": "semantic-release pre",
  "postpublish": "semantic-release post"
}
```

MIT License
2015 Stephan Bönnemann

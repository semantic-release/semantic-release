# 🐘 Using semantic-release to release a PHP/Composer package

You can use semantic-release to release a [Composer](https://getcomposer.org/) package to [packagist.org](https://packagist.org/).
Composer works with GitHub repositories, so all that needs to happen is tag a new release on GitHub.
The last release can be figured out by looking at the git tags of the repository.

### Example annotated `package.json`

```js
{
  "scripts": {
    "semantic-release": "semantic-release"
  },
  "release": {
    // Configure verifyConditions to not check conditions for npm publishing
    "verifyConditions": [
      "@semantic-release/github"
    ],
    // Get the last release from local git tags (instead of from the npm registry)
    "getLastRelease": "@semantic-release/git",
    // Only create a release and tag on GitHub (don't publish to npm)
    "publish": "@semantic-release/github"
  },
  "devDependencies": {
    "@semantic-release/git": "^2.0.0",
    "semantic-release": "^12.0.0"
  }
}
```

### Example annotated `.travis.yml`

```yml
language: php

# Makes jobs install dependencies faster
cache:
  directories:
    - $HOME/.composer/cache
    - $HOME/.npm

jobs:
  include:
    # The test stage expands to two jobs on PHP 7.0 and 7.2
    - stage: test
      php:
        - '7.0'
        - '7.2'
      install:
        - composer install --prefer-dist
      script:
        - vendor/bin/phpunit

    # The release stage is running Node 8
    - stage: release
      language: node_js
      node_js: '8'
      script:
        - npm run semantic-release

stages:
  - test
  - name: release
    if: branch = master AND type = push AND fork = false

# Don't build tags
branches:
  except:
   - /^v\d+\.\d+\.\d+$/
```

This configuration can be adapted for other CI providers too, see the other recipies for examples.

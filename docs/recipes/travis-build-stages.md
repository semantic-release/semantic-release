# Using semantic-release with [Travis build stages](https://docs.travis-ci.com/user/build-stages/)

![Travis Build Stages screenshot](https://cloud.githubusercontent.com/assets/3729517/25229553/0868909c-25d1-11e7-9263-b076fdef9288.gif)

Build stages are a great way to run semantic release compared to running it in `after_success`:

* The release stage can use Node 8, while the other stages can use other versions, even use a completely different language.
* It allows you to easily release a project that is not even written in JavaScript, without impacting the job configuration of your test jobs in any way.
* Instead of having to figure out a "build leader" to do the release and poll the Travis API to wait until all jobs passed, Travis can handle only running the release step after the other jobs passed.
* If the release failed, you can see at a glance that only the release stage failed while your test stage succeded.
* Travis can take care of not running the whole release stage at all on non-master branches and PRs.

### Annotated example `.travis.yml`

```yml
# This could even be a different language
language: node_js

# Define any version matrix you want for testing
node_js:
  - '8'
  - '6'

# This is inherited by all jobs
cache:
  directories:
    - ~/.npm

# This is the script that will only run for your test stage
script:
  - npm run build
  - npm run lint
  - npm test

jobs:
  include:
    - stage: release
      # Set the language to node if you used a different language at the top
      # Otherwise this will be inherited
      language: node_js
      # Explicitely use only Node 8 for release (no matrix)
      node_js: '8'
      # Override script to build and release
      # We use script, not after_success, so we get notified if the release failed for unexpected reasons.
      script:
        # Don't forget to build before releasing if your project has a build step.
        # The release stage doesn't share state with the test stage.
        # Alternatively you could add a prepublishOnly script to package.json
        - npm run build
        - npm run semantic-release

# Define when/under what conditions the jobs should be executed
stages:
  - test
    # Make sure that semantic-release only runs on master and not on PR builds
  - name: release
    if: branch = master AND type = push AND fork = false

# Don't build tags
branches:
  except:
   - /^v\d+\.\d+\.\d+$/
```

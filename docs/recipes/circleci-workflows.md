# Using semantic-release with [CircleCI 2.0 workflows](https://circleci.com/docs/2.0/workflows/)

![CircleCI workflows screenshot](https://github.com/circleci/circleci-docs/raw/928cbb042453ae182996ce05f4e4042b02a24634/jekyll/assets/img/docs/workflow_detail.png)

Similar to Travis build stages, CircleCI 2.0 workflows are a great way to run semantic-release in an independent build step.
We can let CircleCI take care of only running a release on master, after tests passed and running it on an image with Node 8 - your test jobs could use a completely different environment, your project may not even be written in JavaScript.

Make sure to set `NPM_TOKEN` and `GH_TOKEN` in Circle's project settings UI.

### Annotated example `.circleci/config.yml`

```yml
version: 2

jobs:
  # Test on Node 6
  test_node_6:
    docker:
      - image: circleci/node:6
    steps: *test_steps
  # Test on Node 8
  test_node_8:
    docker:
      - image: circleci/node:8
    steps: *test_steps
  # Release if both test jobs passed
  release:
    docker:
      # Use Node 8 for releasing
      - image: circleci/node:8
    steps:
      - checkout
      - *restore_cache
      - run: npm install
      - *save_cache
      - run: npm run semantic-release

# Define when/under what conditions the jobs should be executed
workflows:
  version: 2
  chromeless:
    jobs:
      # Two jobs to test on Node 6 and Node 8
      - test_node_6
      - test_node_8
      # Release job that runs only on master if the two test jobs succeeded
      - release:
          requires:
            - test_node_6
            - test_node_8
          filters:
            branches:
              only: master

# The steps shared between the two test jobs
test_steps: &test_steps
  - checkout
  - *restore_cache
  - run: npm install
  - *save_cache
  - run: npm test

# Restore npm cache (important to make the jobs start up fast)
restore_cache: &restore_cache
  restore_cache:
    keys:
      - npm-cache-{{ checksum "package-lock.json" }}

# Save npm cache (important to make the jobs start up fast)
save_cache: &save_cache
  save_cache:
    key: npm-cache-{{ checksum "package-lock.json" }}
    paths:
      - ~/.npm
```

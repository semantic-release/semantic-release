const efh = require('error-first-handler')
const test = require('tap').test

const createModule = require('../lib/create-module')
const commitToVersionTest = require('../lib/commit-to-version-test')

test('prepublish', (t) => {
  createModule(efh()((name, cwd) => {
    commitToVersionTest(t, 'refactor: change', '0.0.0', 1, 'abort publish w/o changes', cwd)
    commitToVersionTest(t, 'fix: change', '1.0.0', 0, 'release 1.0.0 if unpublished', cwd)
    commitToVersionTest(t, 'fix: change', '1.0.1', 0, 'bump patch for fix', cwd)
    commitToVersionTest(t, 'feat: change', '1.1.0', 0, 'bump minor for feature', cwd)
    commitToVersionTest(t, 'fix: BREAKING CHANGE: change', '2.0.0', 0, 'bump major for breaking change', cwd)
  }))
})

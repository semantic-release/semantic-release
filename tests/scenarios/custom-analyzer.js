const path = require('path')

const efh = require('error-first-handler')
const test = require('tap').test

const createModule = require('../lib/create-module')
const commitToVersionTest = require('../lib/commit-to-version-test')

test('custom-analyzer', (t) => {
  createModule({
    release: {
      analyzer: path.join(__dirname, '../lib/custom-analyzer')
    }
  }, efh()((name, cwd) => {
    commitToVersionTest(t, 'HO', '0.0.0', 1, 'abort publish w/o changes', cwd)
    commitToVersionTest(t, 'BAZ', '1.0.0', 0, 'release 1.0.0 if unpublished', cwd)
    commitToVersionTest(t, 'BAZ', '1.0.1', 0, 'bump patch for fix', cwd)
    commitToVersionTest(t, 'BAR', '1.1.0', 0, 'bump minor for feature', cwd)
    commitToVersionTest(t, 'FOO', '2.0.0', 0, 'bump major for breaking change', cwd)
  }))
})

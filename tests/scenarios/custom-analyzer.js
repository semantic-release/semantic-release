'use strict'

var path = require('path')

var efh = require('error-first-handler')
var test = require('tap').test

var createModule = require('../lib/create-module')
var commitToVersionTest = require('../lib/commit-to-version-test')

test('custom-analyzer', function (t) {
  createModule({
    release: {
      analyzer: path.join(__dirname, '../lib/custom-analyzer')
    }
  }, efh()(function (name, cwd) {
    commitToVersionTest(t, 'HO', '0.0.0', 1, 'abort publish w/o changes', cwd)
    commitToVersionTest(t, 'BAZ', '1.0.0', 0, 'release 1.0.0 if unpublished', cwd)
    commitToVersionTest(t, 'BAZ', '1.0.1', 0, 'bump patch for fix', cwd)
    commitToVersionTest(t, 'BAR', '1.1.0', 0, 'bump minor for feature', cwd)
    commitToVersionTest(t, 'FOO', '2.0.0', 0, 'bump major for breaking change', cwd)
  }))
})

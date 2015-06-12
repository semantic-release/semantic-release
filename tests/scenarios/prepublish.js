'use strict'

var efh = require('error-first-handler')
var test = require('tap').test

var createModule = require('../lib/create-module')
var commitToVersionTest = require('../lib/commit-to-version-test')

test('prepublish', function (t) {
  createModule(efh()(function (name, cwd) {
    commitToVersionTest(t, 'refactor: change', '0.0.0', 1, 'abort publish w/o changes', cwd)
    commitToVersionTest(t, 'fix: change', '1.0.0', 0, 'release 1.0.0 if unpublished', cwd)
    commitToVersionTest(t, 'fix: change', '1.0.1', 0, 'bump patch for fix', cwd)
    commitToVersionTest(t, 'feat: change', '1.1.0', 0, 'bump minor for feature', cwd)
    commitToVersionTest(t, 'fix: BREAKING CHANGE: change', '2.0.0', 0, 'bump major for breaking change', cwd)
  }))
})

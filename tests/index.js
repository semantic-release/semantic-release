'use strict'

var test = require('tape')

var createModule = require('./lib/create-module')

require('./scenarios/custom-analyzer')(test, createModule)
require('./scenarios/custom-verification')(test, createModule)
require('./scenarios/ignore')(test, createModule)
require('./scenarios/prepublish')(test, createModule)
require('./scenarios/postpublish')(test, createModule)
require('./scenarios/publish')(test, createModule)
require('./scenarios/verify')(test, createModule)
require('./scenarios/setup')(test, createModule)

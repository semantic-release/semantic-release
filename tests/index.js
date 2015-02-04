'use strict'

var test = require('tape')

var createModule = require('./lib/create-module')

require('./scenarios/install')(test, createModule)

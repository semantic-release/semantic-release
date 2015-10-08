#!/usr/bin/env node

/* istanbul ignore next */
try {
  require('../dist/cli')
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    require('babel/register')
    require('../src/cli')
  } else {
    console.log(err)
  }
}

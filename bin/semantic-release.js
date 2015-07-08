#!/usr/bin/env node

/* istanbul ignore next */
try {
  require('../dist')
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    require('babel/register')
    require('../src')
  } else {
    console.log(err)
  }
}

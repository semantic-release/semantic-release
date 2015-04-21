'use strict'

var efh = require('error-first-handler')

module.exports = {
  efh: efh,
  standard: efh(function (err) {
    console.log('Something went wrong:')
    if (typeof err === 'string') return console.log(err)
    if (err instanceof Error) return console.log(err.message, err.stack)
    if (err.message) return console.log(err.message)
    console.log(err)
  })
}

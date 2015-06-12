exports.efh = require('error-first-handler')
exports.standard = exports.efh((err) => {
  console.log('Something went wrong:')
  if (typeof err === 'string') return console.log(err)
  if (err instanceof Error) return console.log(err.message, err.stack)
  if (err.message) return console.log(err.message)
  console.log(err)
})

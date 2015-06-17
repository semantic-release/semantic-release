exports.efh = require('error-first-handler')
exports.standard = exports.efh((err) => {
  console.log('Something went wrong:')
  if (typeof err === 'string') console.log(err)
  else if (err instanceof Error) console.log(err.message, err.stack)
  else if (err.message) console.log(err.message)
  else console.log(err)
  process.exit(1)
})

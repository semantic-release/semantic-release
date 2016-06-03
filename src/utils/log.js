var winston = require('winston');

//
// Configure CLI output on the default logger
//
winston.cli();

//
// Configure CLI on an instance of winston.Logger
//
var logger = new winston.Logger({
  transports: [
    new (winston.transports.Console)()
  ]
});

module.exports = logger.cli();
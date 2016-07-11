var log = require('./log');
var shell = require('shelljs');

module.exports = function execAsTask (command, options) {
  return function execShellCommand (done) {
    log.info('+ ' + command);
    const taskOptions = Object.assign({async: true}, options);
    shell.exec(command, taskOptions, function (code, stdout, stderr) {
      (code !== 0) && log.info('ret >', code);
      stdout && !taskOptions.silent && log.info('out >', stdout.toString());
      stderr && log.info('err > ', stderr.toString());
      done(code === 0 ? null : code, stdout);
    });
  }
};

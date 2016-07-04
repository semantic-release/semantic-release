var log = require('./log');
var shell = require('shelljs');

module.exports = function execAsTask (command) {
  return function execShellCommand (done) {
    log.info('+ ' + command);
    shell.exec(command, function (code, stdout, stderr) {
      (code !== 0) && log.info('shell return code: ', code);
      stdout && log.info('\n', stdout.toString());
      stderr && log.error('shell stderr: ', stderr.toString());
      done(code === 0 ? null : code, stdout);
    });
  }
};

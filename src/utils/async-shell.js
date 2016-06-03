var log = require('./log');

module.exports = function nextAsyncShell (asyncDoneCallback) {
  return function (code, stdout, stderr) {
    log.info('shell return code: ', code);
    log.info('shell stdout: ', stdout.toString());
    log.info('shell stderr: ', stderr.toString());

    asyncDoneCallback(code === 0 ? null : code);
  }
};
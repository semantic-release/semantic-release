function debugShell(message, shell, debug) {
  debug(message);
  debug('cmd: %O', shell.cmd);
  debug('stdout: %O', shell.stdout);
  debug('stderr: %O', shell.stderr);
  debug('code: %O', shell.code);
}

module.exports = {debugShell};

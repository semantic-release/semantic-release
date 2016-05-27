module.exports = function nextAsyncShell (asyncDoneCallback) {
  return function (code, stdout, stderr) {
    console.log('shell return code: ', code);
    console.log('shell stdout: ', stdout.toString());
    console.log('shell stderr: ', stderr.toString());

    asyncDoneCallback(code === 0 ? null : code);
  }
}
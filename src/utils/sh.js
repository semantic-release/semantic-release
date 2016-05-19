var async = require('async');
var spawn = require('child_process').spawn;

function spawnAndLog(command, args, opts, done) {
  var proc = spawn(command, args, {cwd: opts.cwd, stdio: [0, 'pipe', 'pipe']});
  var commandString = [command].concat(args).join(' ');
  console.log('> ' + commandString);

  proc.stdout.on('data', function (data) {
    console.log(data.toString());
  });

  proc.stderr.on('data', function (data) {
    console.error(data.toString());
  });

  proc.on('error', function (err) {
    console.error('Error executing ' + commandString + ': ' + err);
    process.exit(1);
  });

  proc.on('exit', done);
}

module.exports = function execCommands(commands, done) {
  async.series(commands.map(function commandToAsyncFunction (command) {
    return function (done) {
      spawnAndLog(command.cmd, command.args, command.opts, done);
    }
  }));

  done();
};
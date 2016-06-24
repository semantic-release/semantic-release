var log = require('./log');
var path = require('path');

module.exports = function bindTasks (tasks, context, packagePath) {
  return tasks.map(function (task) {
    return function () {
      log.info('Executing ' + task.name + ' in ' + (packagePath ? path.relative('.', packagePath) : 'root'));
      return task.apply(context, arguments);
    }
  });
};

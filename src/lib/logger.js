const chalk = require('chalk');

/**
 * Logger with `log` and `error` function.
 */
module.exports = {
  log(...args) {
    const [format, ...rest] = args;
    console.log(`${chalk.grey('[Semantic release]:')} ${format}`, ...rest.map(arg => chalk.magenta(arg)));
  },
  error(...args) {
    const [format, ...rest] = args;
    console.error(
      `${chalk.grey('[Semantic release]:')} ${chalk.red(format instanceof Error ? format.stack : format)}`,
      ...rest.map(arg => chalk.red(arg instanceof Error ? arg.stack : arg))
    );
  },
};

const chalk = require('chalk');

/**
 * Logger with `log` and `error` function.
 */
module.exports = {
  log(...args) {
    const [format, ...rest] = args;
    console.log(
      `${chalk.grey('[Semantic release]:')}${
        typeof format === 'string' ? ` ${format.replace(/%[^%]/g, seq => chalk.magenta(seq))}` : ''
      }`,
      ...(typeof format === 'string' ? [] : [format]).concat(rest)
    );
  },
  error(...args) {
    const [format, ...rest] = args;
    console.error(
      `${chalk.grey('[Semantic release]:')}${typeof format === 'string' ? ` ${chalk.red(format)}` : ''}`,
      ...(typeof format === 'string' ? [] : [format]).concat(rest)
    );
  },
};

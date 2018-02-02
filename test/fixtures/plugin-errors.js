const AggregateError = require('aggregate-error');

module.exports = () => {
  throw new AggregateError([new Error('a'), new Error('b')]);
};

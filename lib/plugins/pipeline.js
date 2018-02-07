const {identity, isFunction} = require('lodash');
const pReflect = require('p-reflect');
const pReduce = require('p-reduce');
const AggregateError = require('aggregate-error');

module.exports = steps => async (input, settleAll = false, getNextInput = identity) => {
  const results = [];
  const errors = [];
  await pReduce(
    steps,
    async (prevResult, nextStep) => {
      let result;

      // Call the next step with the input computed at the end of the previous iteration and save intermediary result
      if (settleAll) {
        const {isFulfilled, value, reason} = await pReflect(nextStep(prevResult));
        result = isFulfilled ? value : reason;
        if (isFulfilled) {
          results.push(result);
        } else {
          errors.push(...(result && isFunction(result[Symbol.iterator]) ? result : [result]));
        }
      } else {
        result = await nextStep(prevResult);
        results.push(result);
      }

      // Prepare input for next step, passing the result of the previous iteration and the current one
      return getNextInput(prevResult, result);
    },
    input
  );
  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
  return results;
};

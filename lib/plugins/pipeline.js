const {identity} = require('lodash');
const pReduce = require('p-reduce');

module.exports = steps => async (input, getNextInput = identity) => {
  const results = [];
  await pReduce(
    steps,
    async (prevResult, nextStep) => {
      // Call the next step with the input computed at the end of the previous iteration
      const result = await nextStep(prevResult);
      // Save intermediary result
      results.push(result);
      // Prepare input for next step, passing the result of the previous iteration and the current one
      return getNextInput(prevResult, result);
    },
    input
  );
  return results;
};

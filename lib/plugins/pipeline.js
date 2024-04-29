import { identity } from "lodash-es";
import pReduce from "p-reduce";
import AggregateError from "aggregate-error";
import { extractErrors } from "../utils.js";

/**
 * A Function that execute a list of function sequencially. If at least one Function ins the pipeline throws an Error or rejects, the pipeline function rejects as well.
 *
 * @typedef {Function} Pipeline
 * @param {Any} input Argument to pass to the first step in the pipeline.
 *
 * @return {Array<*>|*} An Array with the result of each step in the pipeline; if there is only 1 step in the pipeline, the result of this step is returned directly.
 *
 * @throws {AggregateError|Error} An AggregateError with the errors of each step in the pipeline that rejected; if there is only 1 step in the pipeline, the error of this step is thrown directly.
 */

/**
 * Create a Pipeline with a list of Functions.
 *
 * @param {Array<Function>} steps The list of Function to execute.
 * @param {Object} options Pipeline options.
 * @param {Boolean} [options.settleAll=false] If `true` all the steps in the pipeline are executed, even if one rejects, if `false` the execution stops after a steps rejects.
 * @param {Function} [options.getNextInput=identity] Function called after each step is executed, with the last step input and the current current step result; the returned value will be used as the input of the next step.
 * @param {Function} [options.transform=identity] Function called after each step is executed, with the current step result, the step function and the last step input; the returned value will be saved in the pipeline results.
 *
 * @return {Pipeline} A Function that execute the `steps` sequentially
 */
export default (steps, { settleAll = false, getNextInput = identity, transform = identity } = {}) =>
  async (input) => {
    const results = [];
    const errors = [];
    await pReduce(
      steps,
      async (lastInput, step) => {
        let result;
        try {
          // Call the step with the input computed at the end of the previous iteration and save intermediary result
          result = await transform(await step(lastInput), step, lastInput);
          results.push(result);
        } catch (error) {
          if (settleAll) {
            errors.push(...extractErrors(error));
            result = error;
          } else {
            throw error;
          }
        }

        // Prepare input for the next step, passing the input of the last iteration (or initial parameter for the first iteration) and the result of the current one
        return getNextInput(lastInput, result);
      },
      input
    );
    if (errors.length > 0) {
      throw new AggregateError(errors);
    }

    return results;
  };

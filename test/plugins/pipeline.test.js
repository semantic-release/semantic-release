import test from 'ava';
import {stub} from 'sinon';
import AggregateError from 'aggregate-error';
import pipeline from '../../lib/plugins/pipeline';

test('Execute each function in series passing the same input', async t => {
  const step1 = stub().resolves(1);
  const step2 = stub().resolves(2);
  const step3 = stub().resolves(3);

  const result = await pipeline([step1, step2, step3])(0);
  t.deepEqual(result, [1, 2, 3]);
  t.true(step1.calledWith(0));
  t.true(step2.calledWith(0));
  t.true(step3.calledWith(0));

  t.true(step1.calledBefore(step2));
  t.true(step2.calledBefore(step3));
});

test('Execute each function in series passing a transformed input', async t => {
  const step1 = stub().resolves(1);
  const step2 = stub().resolves(2);
  const step3 = stub().resolves(3);
  const step4 = stub().resolves(4);

  const result = await pipeline([step1, step2, step3, step4])(0, false, (prevResult, result) => prevResult + result);

  t.deepEqual(result, [1, 2, 3, 4]);
  t.true(step1.calledWith(0));
  t.true(step2.calledWith(0 + 1));
  t.true(step3.calledWith(0 + 1 + 2));
  t.true(step4.calledWith(0 + 1 + 2 + 3));
  t.true(step1.calledBefore(step2));
  t.true(step2.calledBefore(step3));
  t.true(step3.calledBefore(step4));
});

test('Execute each function in series passing the result of the previous one', async t => {
  const step1 = stub().resolves(1);
  const step2 = stub().resolves(2);
  const step3 = stub().resolves(3);
  const step4 = stub().resolves(4);

  const result = await pipeline([step1, step2, step3, step4])(0, false, (prevResult, result) => result);

  t.deepEqual(result, [1, 2, 3, 4]);
  t.true(step1.calledWith(0));
  t.true(step2.calledWith(1));
  t.true(step3.calledWith(2));
  t.true(step4.calledWith(3));
  t.true(step1.calledBefore(step2));
  t.true(step2.calledBefore(step3));
  t.true(step3.calledBefore(step4));
});

test('Stop execution and throw error is a step rejects', async t => {
  const step1 = stub().resolves(1);
  const step2 = stub().rejects(new Error('test error'));
  const step3 = stub().resolves(3);

  const error = await t.throws(pipeline([step1, step2, step3])(0), Error);
  t.is(error.message, 'test error');
  t.true(step1.calledWith(0));
  t.true(step2.calledWith(0));
  t.true(step3.notCalled);
});

test('Throw all errors from the first step throwing an AggregateError', async t => {
  const error1 = new Error('test error 1');
  const error2 = new Error('test error 2');

  const step1 = stub().resolves(1);
  const step2 = stub().rejects(new AggregateError([error1, error2]));
  const step3 = stub().resolves(3);

  const errors = await t.throws(pipeline([step1, step2, step3])(0));

  t.deepEqual(Array.from(errors), [error1, error2]);
  t.true(step1.calledWith(0));
  t.true(step2.calledWith(0));
  t.true(step3.notCalled);
});

test('Execute all even if a Promise rejects', async t => {
  const error1 = new Error('test error 1');
  const error2 = new Error('test error 2');
  const step1 = stub().resolves(1);
  const step2 = stub().rejects(error1);
  const step3 = stub().rejects(error2);

  const errors = await t.throws(pipeline([step1, step2, step3])(0, true));

  t.deepEqual(Array.from(errors), [error1, error2]);
  t.true(step1.calledWith(0));
  t.true(step2.calledWith(0));
  t.true(step3.calledWith(0));
});

test('Throw all errors from all steps throwing an AggregateError', async t => {
  const error1 = new Error('test error 1');
  const error2 = new Error('test error 2');
  const error3 = new Error('test error 3');
  const error4 = new Error('test error 4');
  const step1 = stub().rejects(new AggregateError([error1, error2]));
  const step2 = stub().rejects(new AggregateError([error3, error4]));

  const errors = await t.throws(pipeline([step1, step2])(0, true));

  t.deepEqual(Array.from(errors), [error1, error2, error3, error4]);
  t.true(step1.calledWith(0));
  t.true(step2.calledWith(0));
});

test('Execute each function in series passing a transformed input even if a step rejects', async t => {
  const error2 = new Error('test error 2');
  const error3 = new Error('test error 3');
  const step1 = stub().resolves(1);
  const step2 = stub().rejects(error2);
  const step3 = stub().rejects(error3);
  const step4 = stub().resolves(4);

  const errors = await t.throws(
    pipeline([step1, step2, step3, step4])(0, true, (prevResult, result) => prevResult + result)
  );

  t.deepEqual(Array.from(errors), [error2, error3]);
  t.true(step1.calledWith(0));
  t.true(step2.calledWith(0 + 1));
  t.true(step3.calledWith(0 + 1 + error2));
  t.true(step4.calledWith(0 + 1 + error2 + error3));
});

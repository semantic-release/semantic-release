import test from 'ava';
import {stub} from 'sinon';
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
});

test('Execute each function in series passing a transformed input', async t => {
  const step1 = stub().resolves(1);
  const step2 = stub().resolves(2);
  const step3 = stub().resolves(3);

  const result = await pipeline([step1, step2, step3])(0, (prevResult, result) => prevResult + result);

  t.deepEqual(result, [1, 2, 3]);
  t.true(step1.calledWith(0));
  t.true(step2.calledWith(1));
  t.true(step3.calledWith(3));
});

test('Stop execution and throw error is a step rejects', async t => {
  const step1 = stub().resolves(1);
  const step2 = stub().throws(new Error('test error'));
  const step3 = stub().resolves(3);

  const error = await t.throws(pipeline([step1, step2, step3])(0), Error);
  t.is(error.message, 'test error');
  t.true(step1.calledWith(0));
  t.true(step2.calledWith(0));
  t.true(step3.notCalled);
});

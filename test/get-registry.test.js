import test from 'ava';
import {stub} from 'sinon';
const getRegistry = require('../lib/get-registry');

test('Get registry from package.json', t => {
  // Retrieve the registry with the get-registry module and verify it returns the one from the package.json in parameter
  t.is(getRegistry({name: 'publish-config', publishConfig: {registry: 'a'}}, {}), 'a');
});

test('Prioritize the package.json registry config', t => {
  // Stub the npmconf object
  const get = stub();

  // Retrieve the registry with the get-registry module and verify it returns the one from the package.json in parameter
  t.is(getRegistry({name: 'publish-config', publishConfig: {registry: 'b'}}, {get}), 'b');

  // Verify the registry has been retrieved from the package.json without trying the stubbed npmconf
  t.true(get.notCalled);
});

test('Get registry for regular package name', t => {
  // Stub the npmconf object returns 'b' for 'registry' property
  const get = stub()
    .withArgs('registry')
    .returns('b');

  // Retrieve the registry with the get-registry module and verify it returns the one configured in the stubbed npmconf
  t.is(getRegistry({name: 'normal'}, {get}), 'b');

  // Verify the registry has been retrieved by calling the stubbed npmconf
  t.true(get.calledWithExactly('registry'));
});

test('Get default registry', t => {
  // Stub the npmconf object, returns 'null'
  const get = stub().returns(null);

  // Retrieve the registry with the get-registry module and verify it returns default one
  t.is(getRegistry({name: 'normal'}, {get}), 'https://registry.npmjs.org/');

  // Verify the module tried first to retrieve the registry by calling the stubbed npmconf
  t.true(get.calledWithExactly('registry'));
});

test('Get registry for scoped package name', t => {
  // Stub the npmconf object, returns 'c' for '@scoped/registry' property
  const get = stub()
    .withArgs('@scoped/registry')
    .returns('c');

  // Retrieve the registry with the get-registry module and verify it returns the one configured in the stubbed npmconf
  t.is(getRegistry({name: '@scoped/foo'}, {get}), 'c');

  // Verify the registry for the scope '@scoped' has been retrieved by calling the stubbed npmconf
  t.true(get.calledWithExactly('@scoped/registry'));
});

test('Get regular registry for scoped package name', t => {
  // Stub the npmconf object, returns 'd' for 'registry' property
  const get = stub()
    .withArgs('registry')
    .returns('d');

  // Retrieve the registry with the get-registry module and verify it returns the regular default one for `@scoped` packages
  t.is(getRegistry({name: '@scoped/baz'}, {get}), 'd');

  // Verify the module tried to retrieve the @scoped registry by calling the stubbed npmconf
  t.true(get.calledWithExactly('@scoped/registry'));
});

test('Get default registry for scoped package name', t => {
  // Stub the npmconf object, returns 'd' for 'registry' property
  const get = stub().returns(null);

  // Retrieve the registry with the get-registry module and verify it returns default one for `@scoped` packages
  t.is(getRegistry({name: '@scoped/baz'}, {get}), 'https://registry.npmjs.org/');

  // Verify the module tried to retrieve the @scoped registry by calling the stubbed npmconf
  t.true(get.calledWithExactly('@scoped/registry'));
  // Verify the module tried to retrieve the regular registry by calling the stubbed npmconf
  t.true(get.calledWithExactly('registry'));
});

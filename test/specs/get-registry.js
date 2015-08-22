const test = require('tap').test

const getRegistry = require('../../dist/lib/get-registry')

test('get correct registry', (t) => {
  t.is(getRegistry({
    name: 'publish-config',
    publishConfig: {
      registry: 'a'
    }},
  {}), 'a')

  t.is(getRegistry({name: 'normal'}, {get: () => 'b'}), 'b')

  t.is(getRegistry({name: 'normal'}, {get: () => null}), 'https://registry.npmjs.org/')

  t.is(getRegistry({name: '@scoped/foo'}, {
    get: (input) => input === '@scoped/registry' ? 'c' : 'd'
  }), 'c')

  t.is(getRegistry({name: '@scoped/bar'}, {
    get: () => 'e'
  }), 'e')

  t.is(getRegistry({name: '@scoped/baz'}, {
    get: () => null
  }), 'https://registry.npmjs.org/')

  t.end()
})

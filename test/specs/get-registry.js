const test = require('tap').test

const getRegistry = require('../../src/lib/get-registry')

test('get correct registry', function (t) {
  t.is(getRegistry({
    name: 'publish-config',
    publishConfig: {
      registry: 'a'
    }},
  {}), 'a')

  t.is(getRegistry({name: 'normal'}, {
    get: function () {
      return 'b'
    }
  }), 'b')

  t.is(getRegistry({name: 'normal'}, {
    get: function () {
      return null
    }
  }), 'https://registry.npmjs.org/')

  t.is(getRegistry({name: '@scoped/foo'}, {
    get: function (input) {
      return input === '@scoped/registry' ? 'c' : 'd'
    }
  }), 'c')

  t.is(getRegistry({name: '@scoped/bar'}, {
    get: function () {
      return 'e'
    }
  }), 'e')

  t.is(getRegistry({name: '@scoped/baz'}, {
    get: function () {
      return null
    }
  }), 'https://registry.npmjs.org/')

  t.end()
})

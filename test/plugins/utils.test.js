const test = require('ava');
const {validatePlugin, validateStep, loadPlugin, parseConfig} = require('../../lib/plugins/utils');

test('validatePlugin', (t) => {
  const path = 'plugin-module';
  const options = {option1: 'value1', option2: 'value2'};

  t.true(validatePlugin(path), 'String definition');
  t.true(validatePlugin({publish: () => {}}), 'Object definition');
  t.true(validatePlugin([path]), 'Array definition');
  t.true(validatePlugin([path, options]), 'Array definition with options');
  t.true(validatePlugin([{publish: () => {}}, options]), 'Array definition with options and path as object');
  t.true(validatePlugin({path}), 'Object with path definition');
  t.true(validatePlugin({path, ...options}), 'Object with path definition with options');
  t.true(
    validatePlugin({path: {publish: () => {}}, ...options}),
    'Object with path  definition with options and path as object'
  );

  t.false(validatePlugin(1), 'String definition, wrong path');
  t.false(validatePlugin([]), 'Array definition, missing path');
  t.false(validatePlugin([path, options, {}]), 'Array definition, additional parameter');
  t.false(validatePlugin([1]), 'Array definition, wrong path');
  t.false(validatePlugin([path, 1]), 'Array definition, wrong options');
  t.false(validatePlugin({path: 1}), 'Object definition, wrong path');
});

test('validateStep: optional plugin configuration', (t) => {
  const type = {multiple: true, required: false};

  // Empty config
  t.true(validateStep(type));
  t.true(validateStep(type, []));

  // Single value definition
  t.true(validateStep(type, 'plugin-path.js'));
  t.true(validateStep(type, () => {}));
  t.true(validateStep(type, ['plugin-path.js']));
  t.true(validateStep(type, [() => {}]));
  t.false(validateStep(type, {}));
  t.false(validateStep(type, [{}]));

  // Array type definition
  t.true(validateStep(type, [['plugin-path.js']]));
  t.true(validateStep(type, [['plugin-path.js', {options: 'value'}]]));
  t.true(validateStep(type, [[() => {}, {options: 'value'}]]));
  t.false(validateStep(type, [['plugin-path.js', 1]]));

  // Object type definition
  t.true(validateStep(type, {path: 'plugin-path.js'}));
  t.true(validateStep(type, {path: 'plugin-path.js', options: 'value'}));
  t.true(validateStep(type, {path: () => {}, options: 'value'}));
  t.false(validateStep(type, {path: null}));

  // Considered as an Array of 2 definitions and not as one Array definition in case of a muliple plugin type
  t.false(validateStep(type, [() => {}, {options: 'value'}]));
  t.false(validateStep(type, ['plugin-path.js', {options: 'value'}]));

  // Multiple definitions
  t.true(
    validateStep(type, [
      'plugin-path.js',
      () => {},
      ['plugin-path.js'],
      ['plugin-path.js', {options: 'value'}],
      [() => {}, {options: 'value'}],
      {path: 'plugin-path.js'},
      {path: 'plugin-path.js', options: 'value'},
      {path: () => {}, options: 'value'},
    ])
  );
  t.false(
    validateStep(type, [
      'plugin-path.js',
      () => {},
      ['plugin-path.js'],
      ['plugin-path.js', 1],
      [() => {}, {options: 'value'}],
      {path: 'plugin-path.js'},
      {path: 'plugin-path.js', options: 'value'},
      {path: () => {}, options: 'value'},
    ])
  );
  t.false(
    validateStep(type, [
      'plugin-path.js',
      {},
      ['plugin-path.js'],
      ['plugin-path.js', {options: 'value'}],
      [() => {}, {options: 'value'}],
      {path: 'plugin-path.js'},
      {path: 'plugin-path.js', options: 'value'},
      {path: () => {}, options: 'value'},
    ])
  );
  t.false(
    validateStep(type, [
      'plugin-path.js',
      () => {},
      ['plugin-path.js'],
      ['plugin-path.js', {options: 'value'}],
      [() => {}, {options: 'value'}],
      {path: null},
      {path: 'plugin-path.js', options: 'value'},
      {path: () => {}, options: 'value'},
    ])
  );
});

test('validateStep: required plugin configuration', (t) => {
  const type = {required: true};

  // Empty config
  t.false(validateStep(type));
  t.false(validateStep(type, []));

  // Single value definition
  t.true(validateStep(type, 'plugin-path.js'));
  t.true(validateStep(type, () => {}));
  t.true(validateStep(type, ['plugin-path.js']));
  t.true(validateStep(type, [() => {}]));
  t.false(validateStep(type, {}));
  t.false(validateStep(type, [{}]));

  // Array type definition
  t.true(validateStep(type, [['plugin-path.js']]));
  t.true(validateStep(type, [['plugin-path.js', {options: 'value'}]]));
  t.true(validateStep(type, [[() => {}, {options: 'value'}]]));
  t.false(validateStep(type, [['plugin-path.js', 1]]));

  // Object type definition
  t.true(validateStep(type, {path: 'plugin-path.js'}));
  t.true(validateStep(type, {path: 'plugin-path.js', options: 'value'}));
  t.true(validateStep(type, {path: () => {}, options: 'value'}));
  t.false(validateStep(type, {path: null}));

  // Considered as an Array of 2 definitions and not as one Array definition in the case of a muliple plugin type
  t.false(validateStep(type, [() => {}, {options: 'value'}]));
  t.false(validateStep(type, ['plugin-path.js', {options: 'value'}]));

  // Multiple definitions
  t.true(
    validateStep(type, [
      'plugin-path.js',
      () => {},
      ['plugin-path.js'],
      ['plugin-path.js', {options: 'value'}],
      [() => {}, {options: 'value'}],
      {path: 'plugin-path.js'},
      {path: 'plugin-path.js', options: 'value'},
      {path: () => {}, options: 'value'},
    ])
  );
  t.false(
    validateStep(type, [
      'plugin-path.js',
      () => {},
      ['plugin-path.js'],
      ['plugin-path.js', 1],
      [() => {}, {options: 'value'}],
      {path: 'plugin-path.js'},
      {path: 'plugin-path.js', options: 'value'},
      {path: () => {}, options: 'value'},
    ])
  );
  t.false(
    validateStep(type, [
      'plugin-path.js',
      {},
      ['plugin-path.js'],
      ['plugin-path.js', {options: 'value'}],
      [() => {}, {options: 'value'}],
      {path: 'plugin-path.js'},
      {path: 'plugin-path.js', options: 'value'},
      {path: () => {}, options: 'value'},
    ])
  );
  t.false(
    validateStep(type, [
      'plugin-path.js',
      () => {},
      ['plugin-path.js'],
      ['plugin-path.js', {options: 'value'}],
      [() => {}, {options: 'value'}],
      {path: null},
      {path: 'plugin-path.js', options: 'value'},
      {path: () => {}, options: 'value'},
    ])
  );
});

test('loadPlugin', async (t) => {
  const cwd = process.cwd();
  const func = () => {};

  t.is(require('../fixtures/plugin-noop'), await loadPlugin({cwd: './test/fixtures'}, './plugin-noop', {}), 'From cwd');
  t.is(
    require('../fixtures/plugin-noop'),
    await loadPlugin({cwd}, './plugin-noop', {'./plugin-noop': './test/fixtures'}),
    'From a shareable config context'
  );
  t.is(func, await loadPlugin({cwd}, func, {}), 'Defined as a function');
});

test('parseConfig', (t) => {
  const path = 'plugin-module';
  const options = {option1: 'value1', option2: 'value2'};

  t.deepEqual(parseConfig(path), [path, {}], 'String definition');
  t.deepEqual(parseConfig({path}), [path, {}], 'Object definition');
  t.deepEqual(parseConfig({path, ...options}), [path, options], 'Object definition with options');
  t.deepEqual(parseConfig([path]), [path, {}], 'Array definition');
  t.deepEqual(parseConfig([path, options]), [path, options], 'Array definition with options');
});

import test from 'ava';
import {validateConfig} from '../../lib/plugins/utils';

test('Validate multiple/optional plugin configuration', t => {
  const type = {multiple: true, required: false};
  t.false(validateConfig(type, {}));
  t.false(validateConfig(type, {path: null}));

  t.true(validateConfig(type, {path: 'plugin-path.js'}));
  t.true(validateConfig(type));
  t.true(validateConfig(type, 'plugin-path.js'));
  t.true(validateConfig(type, ['plugin-path.js']));
  t.true(validateConfig(type, () => {}));
  t.true(validateConfig(type, [{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('Validate multiple/required plugin configuration', t => {
  const type = {multiple: true, required: true};
  t.false(validateConfig(type, {}));
  t.false(validateConfig(type, {path: null}));
  t.false(validateConfig(type));

  t.true(validateConfig(type, {path: 'plugin-path.js'}));
  t.true(validateConfig(type, 'plugin-path.js'));
  t.true(validateConfig(type, ['plugin-path.js']));
  t.true(validateConfig(type, () => {}));
  t.true(validateConfig(type, [{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));
});

test('Validate single/required plugin configuration', t => {
  const type = {multiple: false, required: true};

  t.false(validateConfig(type, {}));
  t.false(validateConfig(type, {path: null}));
  t.false(validateConfig(type, []));
  t.false(validateConfig(type));
  t.false(validateConfig(type, [{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));

  t.true(validateConfig(type, {path: 'plugin-path.js'}));
  t.true(validateConfig(type, 'plugin-path.js'));
  t.true(validateConfig(type, ['plugin-path.js']));
  t.true(validateConfig(type, () => {}));
});

test('Validate single/optional plugin configuration', t => {
  const type = {multiple: false, required: false};

  t.false(validateConfig(type, {}));
  t.false(validateConfig(type, {path: null}));
  t.false(validateConfig(type, [{path: 'plugin-path.js'}, 'plugin-path.js', () => {}]));

  t.true(validateConfig(type));
  t.true(validateConfig(type, []));
  t.true(validateConfig(type, {path: 'plugin-path.js'}));
  t.true(validateConfig(type, 'plugin-path.js'));
  t.true(validateConfig(type, ['plugin-path.js']));
  t.true(validateConfig(type, () => {}));
});

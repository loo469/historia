import test from 'node:test';
import assert from 'node:assert/strict';

import { assertRandomPort, createRandomPort } from '../../../src/application/ports/RandomPort.js';

test('createRandomPort wraps a roller and returns validated immutable results', () => {
  const receivedBounds = [];
  const port = createRandomPort({
    roll(bounds) {
      receivedBounds.push(bounds);
      return {
        value: bounds.min + 2,
        min: bounds.min,
        max: bounds.max,
        seed: 'seed-42',
      };
    },
  });

  const result = port.roll({ min: 3, max: 8 });
  result.value = 99;

  assert.deepEqual(receivedBounds, [{ min: 3, max: 8 }]);
  assert.deepEqual(port.roll({ min: 1, max: 4 }), {
    value: 3,
    min: 1,
    max: 4,
    seed: 'seed-42',
  });
});

test('assertRandomPort validates the contract and preserves context', () => {
  const port = {
    offset: 1,
    roll(bounds) {
      return {
        value: bounds.min + this.offset,
        min: bounds.min,
        max: bounds.max,
      };
    },
  };

  const validatedPort = assertRandomPort(port);

  assert.deepEqual(validatedPort.roll({ min: 4, max: 9 }), {
    value: 5,
    min: 4,
    max: 9,
  });

  assert.throws(() => assertRandomPort({}), /RandomPort roll must be a function/);
  assert.throws(() => validatedPort.roll(null), /RandomPort bounds must be an object/);
  assert.throws(() => validatedPort.roll({ min: 9, max: 4 }), /RandomPort bounds.min must be less than or equal to max/);
});

test('RandomPort rejects invalid roll results and invalid factories', () => {
  const port = createRandomPort({
    roll() {
      return { value: 12, min: 1, max: 6 };
    },
  });

  assert.throws(() => port.roll({ min: 1, max: 6 }), /RandomPort roll result.value must be between min and max/);
  assert.throws(
    () => createRandomPort({ roll: 'nope' }),
    /RandomPort roll must be a function/,
  );
});

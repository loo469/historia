import test from 'node:test';
import assert from 'node:assert/strict';

import { assertRandomPort, createRandomPort } from '../../../src/application/ports/RandomPort.js';

test('createRandomPort wraps a random reader and normalizes rolls', () => {
  const receivedOptions = [];
  const port = createRandomPort({
    nextFloat(options) {
      receivedOptions.push(options);
      return 0.42;
    },
  });

  assert.equal(port.nextFloat({ stream: 'intrigue' }), 0.42);
  assert.deepEqual(receivedOptions, [{ stream: 'intrigue' }]);
});

test('assertRandomPort validates the contract and preserves context', () => {
  const port = {
    offset: 0.1,
    nextFloat(options) {
      return Math.min(1, options.base + this.offset);
    },
  };

  const validatedPort = assertRandomPort(port);

  assert.equal(validatedPort.nextFloat({ base: 0.25 }), 0.35);
  assert.throws(() => assertRandomPort({}), /RandomPort nextFloat must be a function/);
  assert.throws(() => validatedPort.nextFloat(null), /RandomPort options must be an object/);
});

test('RandomPort rejects invalid rolls', () => {
  const highPort = createRandomPort({
    nextFloat() {
      return 1.2;
    },
  });

  const invalidPort = createRandomPort({
    nextFloat() {
      return 'oops';
    },
  });

  assert.throws(() => highPort.nextFloat({}), /RandomPort roll must be between 0 and 1/);
  assert.throws(() => invalidPort.nextFloat({}), /RandomPort roll must be a finite number/);
  assert.throws(() => createRandomPort({ nextFloat: 5 }), /RandomPort nextFloat must be a function/);
});

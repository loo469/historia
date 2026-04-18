import test from 'node:test';
import assert from 'node:assert/strict';

import { RandomProviderPort } from '../../../src/application/culture/RandomProviderPort.js';

class FixedRandomProvider extends RandomProviderPort {
  constructor(value) {
    super();
    this.value = value;
  }

  async nextFloat() {
    return this.value;
  }
}

test('RandomProviderPort validates the float returned by adapters', async () => {
  const validProvider = new FixedRandomProvider(0.42);
  const value = await validProvider.requireNextFloat();

  assert.equal(value, 0.42);

  await assert.rejects(
    () => new FixedRandomProvider(1).requireNextFloat(),
    /RandomProviderPort nextFloat must be a number greater than or equal to 0 and lower than 1/,
  );
  await assert.rejects(
    () => new FixedRandomProvider(-0.1).requireNextFloat(),
    /RandomProviderPort nextFloat must be a number greater than or equal to 0 and lower than 1/,
  );
});

test('RandomProviderPort base adapter method fails fast until implemented', async () => {
  const provider = new RandomProviderPort();

  await assert.rejects(() => provider.nextFloat(), /must be implemented by an adapter/);
});

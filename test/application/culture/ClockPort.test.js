import test from 'node:test';
import assert from 'node:assert/strict';

import { ClockPort } from '../../../src/application/culture/ClockPort.js';

class FixedClock extends ClockPort {
  constructor(value) {
    super();
    this.value = value;
  }

  async now() {
    return this.value;
  }
}

test('ClockPort validates timestamps returned by adapters', async () => {
  const clock = new FixedClock('2026-04-18T14:05:00.000Z');
  const now = await clock.requireNow();

  assert.equal(now, '2026-04-18T14:05:00.000Z');

  await assert.rejects(
    () => new FixedClock('not-a-date').requireNow(),
    /ClockPort now must be a valid ISO timestamp/,
  );
});

test('ClockPort base adapter method fails fast until implemented', async () => {
  const clock = new ClockPort();

  await assert.rejects(() => clock.now(), /must be implemented by an adapter/);
});

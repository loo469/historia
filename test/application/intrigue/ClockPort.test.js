import test from 'node:test';
import assert from 'node:assert/strict';

import { ClockPort } from '../../../src/application/intrigue/ClockPort.js';

class FixedClockPort extends ClockPort {
  constructor(snapshot) {
    super();
    this.snapshot = snapshot;
    this.calls = 0;
  }

  async now() {
    this.calls += 1;
    return this.snapshot;
  }
}

test('ClockPort normalizes current time snapshots from adapters', async () => {
  const clock = new FixedClockPort({
    tick: 42,
    year: 3,
    season: ' autumn ',
    label: 'Turn 42',
  });

  const snapshot = await clock.requireNow();

  assert.equal(clock.calls, 1);
  assert.deepEqual(snapshot, {
    tick: 42,
    year: 3,
    season: 'autumn',
    label: 'Turn 42',
  });
});

test('ClockPort base adapter method fails fast until implemented', async () => {
  const clock = new ClockPort();

  await assert.rejects(() => clock.now(), /must be implemented by an adapter/);
});

test('ClockPort rejects invalid snapshots', async () => {
  const invalidTickClock = new FixedClockPort({ tick: -1, year: 2, season: 'spring' });
  const invalidYearClock = new FixedClockPort({ tick: 4, year: 1.5, season: 'spring' });
  const invalidSeasonClock = new FixedClockPort({ tick: 4, year: 2, season: '   ' });

  await assert.rejects(() => invalidTickClock.requireNow(), /tick must be a non-negative integer/);
  await assert.rejects(() => invalidYearClock.requireNow(), /year must be a non-negative integer/);
  await assert.rejects(() => invalidSeasonClock.requireNow(), /season is required/);

  const malformedClock = new FixedClockPort(null);

  await assert.rejects(() => malformedClock.requireNow(), /snapshot must be an object/);
});

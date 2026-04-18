function requireClockSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new TypeError('ClockPort snapshot must be an object.');
  }

  const tick = snapshot.tick;

  if (!Number.isInteger(tick) || tick < 0) {
    throw new RangeError('ClockPort tick must be a non-negative integer.');
  }

  const year = snapshot.year;

  if (!Number.isInteger(year) || year < 0) {
    throw new RangeError('ClockPort year must be a non-negative integer.');
  }

  const season = String(snapshot.season ?? '').trim();

  if (!season) {
    throw new RangeError('ClockPort season is required.');
  }

  return {
    ...snapshot,
    tick,
    year,
    season,
  };
}

export class ClockPort {
  async now() {
    throw new Error('ClockPort.now must be implemented by an adapter.');
  }

  async requireNow() {
    const snapshot = await this.now();

    return requireClockSnapshot(snapshot);
  }
}

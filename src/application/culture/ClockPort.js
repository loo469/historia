function requireIsoTimestamp(value, label) {
  const normalizedValue = value instanceof Date ? value.toISOString() : String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RangeError(`${label} must be a valid ISO timestamp.`);
  }

  return parsedDate.toISOString();
}

export class ClockPort {
  async now() {
    throw new Error('ClockPort.now must be implemented by an adapter.');
  }

  async requireNow() {
    const value = await this.now();
    return requireIsoTimestamp(value, 'ClockPort now');
  }
}

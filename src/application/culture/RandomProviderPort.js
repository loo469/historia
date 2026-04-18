function requireUnitInterval(value, label) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value >= 1) {
    throw new RangeError(`${label} must be a number greater than or equal to 0 and lower than 1.`);
  }

  return value;
}

export class RandomProviderPort {
  async nextFloat() {
    throw new Error('RandomProviderPort.nextFloat must be implemented by an adapter.');
  }

  async requireNextFloat() {
    const value = await this.nextFloat();
    return requireUnitInterval(value, 'RandomProviderPort nextFloat');
  }
}
